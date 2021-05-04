//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;
pragma abicoder v2;
import "@openzeppelin/contracts/access/AccessControl.sol";
import {IFLD} from "../interfaces/IFLD.sol";
import {IERC20} from "../interfaces/IERC20.sol";

contract StakeRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");

    bytes32 public constant ZERO_HASH =
        0x0000000000000000000000000000000000000000000000000000000000000000;

    mapping(uint256 => address[]) public phases;

    mapping(bytes32 => address) public vaults; // vaultNames - Vault
    mapping(address => bytes32) public vaultNames; // vault - vaultNames

    mapping(address => address[]) public stakeContractsOfVault; // vault - stakeContracts[]
    mapping(address => address) public stakeContractVault; // stakeContract - vault

    modifier onlyOwner() {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "StakeRegistry: Caller is not an admin"
        );
        _;
    }

    constructor() {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function addVault(
        uint256 _pahse,
        bytes32 _vaultName,
        address _vault
    ) external onlyOwner {
        require(
            vaultNames[_vault] == ZERO_HASH || vaults[_vaultName] == address(0),
            "StakeRegistry: addVault input value is not zero"
        );
        vaults[_vaultName] = _vault;
        vaultNames[_vault] = _vaultName;
        phases[_pahse].push(_vault);
    }

    function validVault(uint256 _pahse, address _vault)
        external
        view
        returns (bool valid)
    {
        require(
            phases[_pahse].length > 0 && vaultNames[_vault] != ZERO_HASH,
            "StakeRegistry: validVault is fail"
        );

        for (uint256 i = 0; i < phases[_pahse].length; i++) {
            if (_vault == phases[_pahse][i]) valid = true;
        }
    }

    function addStakeContract(address _vault, address _stakeContract)
        external
        onlyOwner
    {
        require(
            vaultNames[_vault] != ZERO_HASH &&
                stakeContractVault[_stakeContract] == address(0),
            "StakeRegistry: input is zero"
        );
        stakeContractVault[_stakeContract] = _vault;
        stakeContractsOfVault[_vault].push(_stakeContract);
    }

    function phasesAll(uint256 _index)
        external
        view
        returns (address[] memory)
    {
        return phases[_index];
    }

    function stakeContractsOfVaultAll(address _vault)
        external
        view
        returns (address[] memory)
    {
        return stakeContractsOfVault[_vault];
    }
}
