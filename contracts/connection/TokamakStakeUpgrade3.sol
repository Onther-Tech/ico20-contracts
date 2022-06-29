// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
pragma abicoder v2;

import "../interfaces/ITokamakStaker.sol";
import {ITON} from "../interfaces/ITON.sol";
import {IIStake1Vault} from "../interfaces/IIStake1Vault.sol";
import {IIIDepositManager} from "../interfaces/IIIDepositManager.sol";
import {IISeigManager} from "../interfaces/IISeigManager.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../libraries/FixedPoint96.sol";
import "../libraries/FullMath.sol";
import "../libraries/TickMath.sol";

import "../common/AccessibleCommon.sol";

import "../stake/StakeTONStorage.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";


interface IIUniswapV3Factory {
    function getPool(address,address,uint24) external view returns (address);
}

interface IIUniswapV3Pool {

    function token0() external view returns (address);
    function token1() external view returns (address);

    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        );

}

interface IERC20BASE2 {
    function decimals() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
}


interface ITokamakRegistry2 {
    function getTokamak()
        external
        view
        returns (
            address,
            address,
            address,
            address,
            address
        );

    function getUniswap()
        external
        view
        returns (
            address,
            address,
            address,
            uint256,
            address
        );
}

/// @title The connector that integrates tokamak
contract TokamakStakeUpgrade3 is
    StakeTONStorage,
    AccessibleCommon
{
    using SafeMath for uint256;


    modifier lock() {
        require(_lock == 0, "TokamakStaker:LOCKED");
        _lock = 1;
        _;
        _lock = 0;
    }

    modifier onlyClosed() {
        require(IIStake1Vault(vault).saleClosed(), "TokamakStaker: not closed");
        _;
    }

    /// @dev exchange WTON to TOS using uniswap v3
    /// @param caller the sender
    /// @param amountIn the input amount
    /// @return amountOut the amount of exchanged out token
    event ExchangedWTONtoTOS(
        address caller,
        uint256 amountIn,
        uint256 amountOut
    );


    /// @dev If the tokamak addresses is not set, set the addresses.
    function checkTokamak() public {
        if (ton == address(0)) {
            (
                address _ton,
                address _wton,
                address _depositManager,
                address _seigManager,
                address _swapProxy
            ) = ITokamakRegistry2(stakeRegistry).getTokamak();

            ton = _ton;
            wton = _wton;
            depositManager = _depositManager;
            seigManager = _seigManager;
            swapProxy = _swapProxy;
        }
        require(
            ton != address(0) &&
                wton != address(0) &&
                seigManager != address(0) &&
                depositManager != address(0) &&
                swapProxy != address(0),
            "TokamakStaker:tokamak zero"
        );
    }

    function version() external pure returns (string memory) {
        return "phase1.upgrade.v3";
    }

    /// @dev exchange holded WTON to TOS using uniswap
    /// @param _amountIn the input amount
    /// @param _amountOutMinimum the minimun output amount
    /// @param _sqrtPriceLimitX96 sqrtPriceLimitX96
    function exchangeWTONtoTOS(
        uint256 _amountIn,
        uint256 _amountOutMinimum,
        uint160 _sqrtPriceLimitX96,
        uint8 slippage,
        int24 curTick
    ) external lock onlyClosed {
        require(block.number <= endBlock, "TokamakStaker: period end");

        checkTokamak();

        //--
        require(slippage > 0 && slippage <= 10, "It is not allowed slippage.");
        IIUniswapV3Pool pool = IIUniswapV3Pool(getPoolAddress());
        require(address(pool) != address(0), "pool didn't exist");

        (uint160 sqrtPriceX96, int24 tick,,,,,) =  pool.slot0();
        require(sqrtPriceX96 > 0, "pool is not initialized");

        // uint24 fee = 3000;
        // int24 tickSpacings = 60;
        // int24 acceptTickInterval = 8;

        require(
            acceptMinTick(tick, 60, 8) <= curTick
            && curTick < acceptMaxTick(tick, 60, 8),
            "It's not allowed changed tick range."
        );

        // ---
        uint256 amountIn = _amountIn;
        uint256 amountOutMinimum = _amountOutMinimum;
        uint160 sqrtPriceLimitX96 = _sqrtPriceLimitX96;

        {
            uint256 _amountWTON = IERC20BASE2(wton).balanceOf(address(this));
            uint256 _amountTON = IERC20BASE2(ton).balanceOf(address(this));
            uint256 stakeOf = 0;
            if (tokamakLayer2 != address(0)) {
                stakeOf = IISeigManager(seigManager).stakeOf(
                    tokamakLayer2,
                    address(this)
                );
                stakeOf = stakeOf.add(
                    IIIDepositManager(depositManager).pendingUnstaked(
                        tokamakLayer2,
                        address(this)
                    )
                );
            }

            uint256 holdAmount = _amountWTON;
            if (_amountTON > 0)
                holdAmount = holdAmount.add(_amountTON.mul(10**9));
            require(
                holdAmount >= amountIn,
                "TokamakStaker: wton insufficient"
            );

            if (stakeOf > 0) holdAmount = holdAmount.add(stakeOf);

            require(
                holdAmount > totalStakedAmount.mul(10**9) &&
                    holdAmount.sub(totalStakedAmount.mul(10**9)) >= amountIn,
                "TokamakStaker:insufficient"
            );
            if (_amountWTON < amountIn) {
                bytes memory data = abi.encode(swapProxy, swapProxy);
                uint256 swapTON = amountIn.sub(_amountWTON).div(10**9);
                require(
                    ITON(ton).approveAndCall(wton, swapTON, data),
                    "TokamakStaker:exchangeWTONtoTOS approveAndCall fail"
                );
            }
        }

        toUniswapWTON = toUniswapWTON.add(amountIn);
        (address uniswapRouter, , , uint256 _fee, ) =
            ITokamakRegistry2(stakeRegistry).getUniswap();
        require(uniswapRouter != address(0), "TokamakStaker:uniswap zero");
        require(
            IERC20BASE2(wton).approve(uniswapRouter, amountIn),
            "TokamakStaker:can't approve uniswapRouter"
        );

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: wton,
                tokenOut: token,
                fee: uint24(_fee),
                recipient: address(this),
                deadline: block.timestamp + 1000,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            });
        uint256 amountOut = ISwapRouter(uniswapRouter).exactInputSingle(params);

        //--
        uint256 price = getPriceX96FromSqrtPriceX96(sqrtPriceX96);
        uint256 _slippage = uint256(slippage);
        (uint160 sqrtPriceX961,,,,,,) =  pool.slot0();
        uint256 price1 = getPriceX96FromSqrtPriceX96(sqrtPriceX961);

        uint256 lower = price.mul( 1000 - (_slippage * 1000 / 200) ).div(1000) ;
        uint256 upper = price.mul( 1000 + (_slippage * 1000 / 200) ).div(1000) ;

        require(lower <= price1 && price1 < upper, "out of acceptable price range");
        //--

        emit ExchangedWTONtoTOS(msg.sender, amountIn, amountOut);
    }

    function getPoolAddress() public view returns(address) {
        address factory = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
        return IIUniswapV3Factory(factory).getPool(wton, token, 3000);
    }

    function getDecimals(address token0, address token1) public view returns(uint256 token0Decimals, uint256 token1Decimals) {
        return (IERC20BASE2(token0).decimals(), IERC20BASE2(token1).decimals());
    }

    function getPriceX96FromSqrtPriceX96(uint160 sqrtPriceX96) public pure returns(uint256 priceX96) {
        return FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, FixedPoint96.Q96);
    }

    function currentTick() public view returns(uint160 sqrtPriceX96, int24 tick) {
        address getPool = getPoolAddress();
        if(getPool != address(0)) {
            (uint160 sqrtPriceX96, int24 tick,,,,,) =  IIUniswapV3Pool(getPool).slot0();
            return (sqrtPriceX96, tick);
        }
        return (0, 0);
    }

    function getMiniTick(int24 tickSpacings) public view returns (int24){
           return (TickMath.MIN_TICK / tickSpacings) * tickSpacings ;
    }

    function getMaxTick(int24 tickSpacings) public view  returns (int24){
           return (TickMath.MAX_TICK / tickSpacings) * tickSpacings ;
    }

    function acceptMinTick(int24 _tick, int24 _tickSpacings, int24 _acceptTickInterval) public returns (int24)
    {

        int24 _minTick = getMiniTick(_tickSpacings);
        int24 _acceptMinTick = _tick - (_tickSpacings * _acceptTickInterval);

        if(_minTick < _acceptMinTick) return _acceptMinTick;
        else return _minTick;
    }

    function acceptMaxTick(int24 _tick, int24 _tickSpacings, int24 _acceptTickInterval) public returns (int24)
    {
        int24 _maxTick = getMaxTick(_tickSpacings);
        int24 _acceptMinTick = _tick + (_tickSpacings * _acceptTickInterval);

        if(_maxTick < _acceptMinTick) return _maxTick;
        else return _acceptMinTick;
    }

}
