//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../libraries/LibUniswapV3Stake.sol";

interface IStakeUniswapV3 {
    /// @dev Initialize
    /// @param _token  the reward token address , It is TOS address.
    /// @param _paytoken  Tokens staked by users, can be used as ERC20 tokens.
    //                     (In case of ETH, input address(0))
    /// @param _vault  the _ault's address
    /// @param _saleStartBlock  the sale start block
    /// @param _startBlock  the staking start block
    /// @param _period the period that user can generate reward amount
    function initialize(
        address _token,
        address _paytoken,
        address _vault,
        uint256 _saleStartBlock,
        uint256 _startBlock,
        uint256 _period
    ) external;

    /// @dev stakeLiquidity
    function stakeLiquidity(uint256 tokenId) external;
    
    /// @dev increaseLiquidity
    function increaseLiquidity(INonfungiblePositionManager.IncreaseLiquidityParams calldata params)
        external
        returns (
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );

    /// @dev decrseaseLiquidity
    function decreaseLiquidity(INonfungiblePositionManager.DecreaseLiquidityParams calldata params)
        external
        returns (
            uint256 amount0,
            uint256 amount1
        );

    /// @dev transferLiquidityToNewToken
    function modifyPosition(LibUniswapV3Stake.ModifyPositionParams calldata params)
        external
        returns (
            uint256 newTokenId,
            uint128 newLiquidity,
            uint256 newAmount0,
            uint256 newAmount1
        );

    /// @dev withdraw
    function withdraw(uint256 tokenId) external;

    /// @dev Claim for reward
    function claim(uint256 tokenId) external;

    /// @dev Returns the amount that can be rewarded
    /// @param account  the account that claimed reward
    /// @param tokenId the block that claimed reward
    /// @return reward the reward amount that can be taken
    function canRewardAmount(address account, uint256 tokenId)
        external
        view
        returns (uint256 reward);
}