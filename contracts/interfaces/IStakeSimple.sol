//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;

interface IStakeSimple {
    /// @dev Stake amount
    /// @param amount  the amount of staked
    function stake(uint256 amount) external payable;

    /// @dev withdraw
    function withdraw() external;

    /// @dev Claim for reward
    function claim() external;

    /// @dev Returns the amount that can be rewarded
    /// @param account  the account that claimed reward
    /// @param specificBlock the block that claimed reward
    /// @return reward the reward amount that can be taken
    function canRewardAmount(address account, uint256 specificBlock)
        external
        view
        returns (uint256);
}
