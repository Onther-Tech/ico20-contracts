//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;

//import "../interfaces/IStake1Storage.sol";
import "../libraries/LibTokenStake1.sol";

/// @title The base storage of stakeContract
contract Stake1Storage {
    /// @dev reward token : FLD
    address public token;

    /// @dev registry
    address public stakeRegistry;

    /// @dev paytoken is the token that the user stakes. ( if paytoken is ether, paytoken is address(0) )
    address public paytoken;

    /// @dev A vault that holds fld rewards.
    address public vault;

    /// @dev the start block for sale.
    uint256 public saleStartBlock;

    /// @dev the staking start block, once staking starts, users can no longer apply for staking.
    uint256 public startBlock;

    /// @dev the staking end block.
    uint256 public endBlock;

    /// @dev the total amount claimed
    uint256 public rewardClaimedTotal;

    /// @dev the total staked amount
    uint256 public totalStakedAmount;

    /// @dev information staked by user
    mapping(address => LibTokenStake1.StakedAmount) public userStaked;

    /// @dev total stakers
    uint256 public totalStakers;

    uint256 internal _lock;

    /// @dev user's staked information
    function getUserStaked(address user)
        external
        view
        returns (
            uint256 amount,
            uint256 claimedBlock,
            uint256 claimedAmount,
            uint256 releasedBlock,
            uint256 releasedAmount,
            uint256 releasedFLDAmount,
            bool released
        )
    {
        return (
            userStaked[user].amount,
            userStaked[user].claimedBlock,
            userStaked[user].claimedAmount,
            userStaked[user].releasedBlock,
            userStaked[user].releasedAmount,
            userStaked[user].releasedFLDAmount,
            userStaked[user].released
        );
    }
}
