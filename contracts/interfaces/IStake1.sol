//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;
pragma abicoder v2;

import "../libraries/LibTokenStake1.sol";

interface IStake1 {
    function token() external view returns (address);

    function paytoken() external view returns (address);

    function vault() external view returns (address);

    function saleStartBlock() external view returns (uint256);

    function startBlock() external view returns (uint256);

    function endBlock() external view returns (uint256);

    function rewardRaised() external view returns (uint256);

    function totalStakedAmount() external view returns (uint256);

    function userStaked(address account)
        external
        returns (LibTokenStake1.StakedAmount memory);

    function stake(uint256 amount) external payable;

    function onApprove(
        address owner,
        address spender,
        uint256 tonAmount,
        bytes calldata data
    ) external returns (bool);

    function stakeOnApprove(
        address _owner,
        address _spender,
        uint256 _amount
    ) external;

    function tokamakStaking(address _layer2, uint256 _amount) external;

    function tokamakRequestUnStakingAll(address _layer2) external;

    function tokamakRequestUnStaking(address _layer2, uint256 _amount) external;

    function tokamakProcessUnStaking(address _layer2, bool receiveTON) external;

    function tokamakPendingUnstaked(address _layer2)
        external
        view
        returns (uint256 wtonAmount);

    function tokamakAccStaked(address _layer2)
        external
        view
        returns (uint256 wtonAmount);

    function tokamakAccUnstaked(address _layer2)
        external
        view
        returns (uint256 wtonAmount);

    function tokamakStakeOf(address _layer2)
        external
        view
        returns (uint256 wtonAmount);
}