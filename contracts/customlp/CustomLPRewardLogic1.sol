// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "../libraries/LibCustomLP.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Math} from "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/ICustomCommonLib.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../common/AccessibleCommon.sol";
import "./CustomLPRewardStorage.sol";

contract CustomLPRewardLogic1 is CustomLPRewardStorage, AccessibleCommon {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "CustomLPRewardLogic1: zero address");
        _;
    }
    modifier nonZero(uint256 _val) {
        require(_val > 0, "CustomLPRewardLogic1: zero value");
        _;
    }

    modifier noReentrancy() {
        require(_lock == 0, "CustomLPRewardLogic1: noReentrancy");
        _lock = 1;
        _;
        _lock = 0;
    }

    constructor() {
        rewardCount = 0;
    }

    function poolCheck(address token0, address token1) public view {
       require(
            (token0 == poolToken0 && token1 == poolToken1) ||
                (token0 == poolToken1 && token1 == poolToken0),
            "CustomLPRewardLogic1: different token"
        );
    }

    function canClaimableWhenFullLiquidity(uint256 tokenId, uint256 _timestamp)
        public view returns (bool canFlag, uint256[] memory claimableList, address[] memory tokenList, address[] memory donatorList, uint256[] memory tokenIndexList)
    {
        if(rewardCount > 0){
            bool can = false;
            uint256[] memory canClaimed = new uint256[](rewardCount);
            address[] memory tokens = new address[](rewardCount);
            address[] memory donators = new address[](rewardCount);
            uint256[] memory tokenIndex = new uint256[](rewardCount);

            for(uint256 i=1; i <= rewardCount; i++){
                LibCustomLP.ClaimInfoLP storage _claimsByTokenIds = claimsByTokenIds[tokenId][i];
                tokenIndex[i-1] = i;

                if(_claimsByTokenIds.lastClaimedTime >= _timestamp ) canClaimed[i] = 0;
                else {
                    LibCustomLP.RewardToken storage _rewardToken = rewardTokens[i];
                    if(_timestamp <= _rewardToken.lastRewardTime && _timestamp >= _rewardToken.start ) {
                        uint256 reward = _claimsByTokenIds.amount;
                        reward = reward.mul(_rewardToken.tokenPerShare).div(10000);
                        if(reward <= _claimsByTokenIds.debt) canClaimed[i] = 0;
                        else {
                            reward = reward.sub(_claimsByTokenIds.debt);
                            canClaimed[i] =  reward;
                            tokens[i] = _rewardToken.token;
                            donators[i] = _rewardToken.donator;
                            if(!can && reward > 0) can = true;
                        }
                    } else {
                        uint256 end = Math.min(_timestamp, _rewardToken.end);
                        uint256 reward1 = end.sub(_rewardToken.lastRewardTime).mul(_rewardToken.rewardPerSecond);
                        uint256 tokenShare = _rewardToken.tokenPerShare.add(reward1.mul(10000).div(totalStakedAmount));
                        uint256 reward = _claimsByTokenIds.amount.mul(tokenShare).div(10000).sub(_claimsByTokenIds.debt);
                        canClaimed[i] =  reward;
                        tokens[i] = _rewardToken.token;
                        donators[i] = _rewardToken.donator;
                        if(!can && reward > 0) can = true;
                    }
                }
            }
            return (can, canClaimed, tokens, donators, tokenIndex);
        }else{
            uint256[] memory data = new uint256[](1);
            address[] memory addr = new address[](1);
            return (false, data,addr,addr,data);
        }
    }

    function currentliquidityTokenId(
        uint256 tokenId,
        uint256 expectBlocktimestamp
    )
        public
        view
        nonZeroAddress(poolAddress)
        returns (
            uint256 secondsAbsolute,
            uint256 secondsInsideDiff256,
            uint160 secondsInside,
            uint256 expectTime
        )
    {
        secondsAbsolute = 0;
        secondsInsideDiff256 = 0;
        expectTime = 0;
        secondsInside = 0;

        expectTime = expectBlocktimestamp;

        LibCustomLP.StakeLiquidity storage _depositTokens = depositTokens[tokenId];
        (, , secondsInside) =
            IUniswapV3Pool(poolAddress).snapshotCumulativesInside(
                _depositTokens.tickLower,
                _depositTokens.tickUpper
            );

        if (
            expectTime > _depositTokens.claimedTime &&
            expectTime > _depositTokens.startTime
        ) {
            if (_depositTokens.claimedTime > 0) {
                secondsAbsolute = expectTime.sub(
                    (uint256)(_depositTokens.claimedTime)
                );
            } else {
                secondsAbsolute = expectTime.sub(
                    (uint256)(_depositTokens.startTime)
                );
            }

            if (secondsAbsolute > 0) {
                if (_depositTokens.secondsInsideLast > 0) {
                    secondsInsideDiff256 = uint256(secondsInside).sub(
                        uint256(_depositTokens.secondsInsideLast)
                    );
                } else {
                    secondsInsideDiff256 = uint256(secondsInside).sub(
                        uint256(_depositTokens.secondsInsideInitial)
                    );
                }
            }
        }

    }

    /// @dev stake tokenId of UniswapV3
    /// @param tokenId  tokenId
    function stake(uint256 tokenId)
        external
        nonZeroAddress(stakeRegistry)
        nonZeroAddress(address(nonfungiblePositionManager))
        nonZeroAddress(uniswapV3Factory)
        nonZeroAddress(poolAddress)
        nonZeroAddress(poolToken0)
        nonZeroAddress(poolToken1)
        nonZeroAddress(commonLib)
    {
        require(
            nonfungiblePositionManager.ownerOf(tokenId) == msg.sender,
            "CustomLPRewardLogic1: not owner"
        );

        LibCustomLP.StakeLiquidity storage _depositTokens = depositTokens[tokenId];

        require(
            _depositTokens.owner == address(0),
            "CustomLPRewardLogic1: Already staked"
        );

        uint256 _tokenId = tokenId;
        (
            ,
            ,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            ,
            ,
            ,

        ) = nonfungiblePositionManager.positions(_tokenId);

        poolCheck(token0, token1);
        require(liquidity > 0, "CustomLPRewardLogic1: zero liquidity");

        require(
            ICustomCommonLib(commonLib).checkCurrentPosition(poolAddress, tickLower, tickUpper),
            "CustomLPRewardLogic1: locked or out of range"
        );
        (, , uint32 secondsInside) =
            IUniswapV3Pool(poolAddress).snapshotCumulativesInside(
                tickLower,
                tickUpper
            );

        uint256 tokenId_ = _tokenId;

        _depositTokens.owner = msg.sender;
        _depositTokens.liquidity = liquidity;
        _depositTokens.tickLower = tickLower;
        _depositTokens.tickUpper = tickUpper;
        _depositTokens.startTime = uint32(block.timestamp);
        _depositTokens.claimedTime = 0;
        _depositTokens.secondsInsideInitial = secondsInside;
        _depositTokens.secondsInsideLast = 0;

        nonfungiblePositionManager.transferFrom(
            msg.sender,
            address(this),
            tokenId_
        );

        userStakedTokenIds[msg.sender].push(tokenId_);

        totalStakedAmount = totalStakedAmount.add(liquidity);
        totalTokens = totalTokens.add(1);

       // emit Staked(msg.sender, poolAddress, tokenId_, liquidity);
    }


    function claim(uint256 tokenId) public returns (bool) {
        require(
            rewardCount > 0,
            "CustomLPRewardLogic1: no reward"
        );

        LibCustomLP.StakeLiquidity storage _depositTokens = depositTokens[tokenId];
        require(
            _depositTokens.owner == msg.sender,
            "CustomLPRewardLogic1: not staker"
        );

        updateReward();

        (bool can, uint256[] memory rewards, address[] memory tokens, address[] memory donators, uint256[] memory tokenIndex)
            = canClaimableWhenFullLiquidity(tokenId, block.timestamp);
        require(can, "CustomLPRewardLogic1: no claimable amount");
        require(rewards.length == tokens.length, "CustomLPRewardLogic1: diff rewards,tokens length");
        require(rewards.length == donators.length, "CustomLPRewardLogic1: diff rewards,donators length");
        require(rewards.length == tokenIndex.length, "CustomLPRewardLogic1: diff rewards,tokenIndex length");

        uint256 secondsAbsolute = 0;
        uint256 secondsInsideDiff256 = 0;
        uint160 secondsInside = 0;

        (secondsAbsolute, secondsInsideDiff256, secondsInside, ) = currentliquidityTokenId(tokenId, block.timestamp);

        require(secondsAbsolute > 0 && secondsInsideDiff256 > 0 , "no liquidity");

        require(
            _depositTokens.lock == false,
            "CustomLPRewardLogic1: claiming"
        );
        _depositTokens.lock = true;

        _depositTokens.claimedTime = uint32(block.timestamp);
        _depositTokens.secondsInsideLast = secondsInside;

        // give rewards
        for(uint256 i = 0; i< rewards.length ; i++){

            if(rewards[i] > 0 && tokens[i] != address(0) ){

                LibCustomLP.ClaimInfoLP storage _lp = claimsByTokenIds[tokenId][tokenIndex[i]];

                uint256 calimRewardAmount = 0;
                if(secondsAbsolute > secondsInsideDiff256 ){
                    calimRewardAmount = rewards[i].mul(secondsInsideDiff256).div(secondsAbsolute);
                }else{
                    calimRewardAmount = rewards[i];
                }

                _lp.claimedAmount = _lp.claimedAmount.add(calimRewardAmount);
                _lp.lastClaimedTime = block.timestamp;
                _lp.debt = _lp.debt.add(rewards[i]);

                require(IERC20(tokens[i]).balanceOf(address(this)) >= rewards[i] , "CustomLPRewardLogic1: insufficeient");
                IERC20(tokens[i]).safeTransfer(msg.sender, calimRewardAmount);
                if(rewards[i] > calimRewardAmount ){
                    IERC20(tokens[i]).safeTransfer(donators[i], rewards[i].sub(calimRewardAmount));
                }
            }
        }
        _depositTokens.lock = false;
        return true;
    }


    function updateReward() public {
        require(
            rewardCount > 0,
            "CustomLPRewardLogic1: no reward"
        );
        if (totalStakedAmount == 0) {
            return;
        }
        for(uint256 i=1; i <= rewardCount; i++){
            LibCustomLP.RewardToken storage _rewardToken = rewardTokens[i];
            uint256 curTime = block.timestamp;
            if(curTime <= _rewardToken.start ) curTime = 0;
            if(curTime > _rewardToken.end ) curTime = _rewardToken.end;
            if(curTime > 0 && curTime > _rewardToken.lastRewardTime){
                uint256 reward = curTime.sub(_rewardToken.lastRewardTime).mul(_rewardToken.rewardPerSecond);
                _rewardToken.tokenPerShare = _rewardToken.tokenPerShare.add(reward.mul(10000).div(totalStakedAmount));
                _rewardToken.lastRewardTime = curTime;
            }
        }
    }

    function donateReward(
        address token,
        uint256 amount,
        uint256 periodSeconds
    )
        external
        nonZeroAddress(token)
        // nonZeroAddress(stakeRegistry)
        // nonZeroAddress(address(nonfungiblePositionManager))
        // nonZeroAddress(uniswapV3Factory)
        // nonZeroAddress(poolAddress)
        // nonZeroAddress(poolToken0)
        // nonZeroAddress(poolToken1)
        // nonZeroAddress(commonLib)
        nonZero(amount)
        nonZero(periodSeconds)
        noReentrancy
    {
        require(amount >= minimumDonation, "CustomLPRewardLogic1: less than minimum donation");
        require(token != address(0) && amount <= IERC20(token).balanceOf(msg.sender), "CustomLPRewardLogic1: donate insufficeient");
        rewardCount = rewardCount.add(1);
        LibCustomLP.RewardToken storage _reward = rewardTokens[rewardCount];
        require(!_reward.allocated, "CustomLPRewardLogic1: alreay allocated");

        _reward.allocated = true;
        _reward.token = token;
        _reward.donator = msg.sender;
        _reward.allocatedAmount = amount;
        _reward.start = block.timestamp;
        _reward.end = block.timestamp.add(periodSeconds);
        _reward.rewardPerSecond = 0;
        _reward.tokenPerShare = 0;
        _reward.lastRewardTime = block.timestamp;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

}
