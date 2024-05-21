// SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@openzeppelin/contracts/math/SignedSafeMath.sol";

// import "../interfaces/ILockTOSv2Action0.sol";
// import "../interfaces/ITOS.sol";
import "../libraries/LibLockTOS.sol";
import "../common/AccessibleCommon.sol";
import "./LockTOSStorage.sol";
import "./ProxyBase.sol";
import "./LockTOSv2Storage.sol";

// import "hardhat/console.log";

interface MyTreasury {
    function isTreasury() external view returns (bool);
}

contract LockTOSv2Logic1 is
    LockTOSStorage,
    AccessibleCommon,
    ProxyBase,
    LockTOSv2Storage
{
    using SafeMath for uint256;
    using SafeCast for uint256;
    using SignedSafeMath for int256;

    modifier ifFree {
        require(free == 1, "LockId is already in use");
        free = 0;
        _;
        free = 1;
    }

     function needCheckpointCount() external view returns (uint256 needCount) {
        uint256 len = pointHistory.length;
        if (len != 0) {
            uint256 startUnitTime =  (block.timestamp - pointHistory[len - 1].timestamp).div(epochUnit).mul(epochUnit);
            needCount = (block.timestamp - startUnitTime) / epochUnit;
        }
    }

    function globalCheckpoint(uint256 count) external {
        _recordHistoryPoints(count);
    }

    function _recordHistoryPoints(uint256 count)
        internal
        returns (LibLockTOS.Point memory lastWeek)
    {
        uint256 timestamp = block.timestamp;
        if (pointHistory.length > 0) {
            lastWeek = pointHistory[pointHistory.length - 1];
        } else {
            lastWeek = LibLockTOS.Point({
                bias: 0,
                slope: 0,
                timestamp: timestamp
            });
        }

        uint256 num = 0;
        // Iterate through all past unrecoreded weeks and record
        uint256 pointTimestampIterator =
            lastWeek.timestamp.div(epochUnit).mul(epochUnit);
        while (pointTimestampIterator != timestamp && num < count) {
            pointTimestampIterator = Math.min(
                pointTimestampIterator.add(epochUnit),
                timestamp
            );
            int256 deltaSlope = slopeChanges[pointTimestampIterator];
            int256 deltaTime =
                Math.min(pointTimestampIterator.sub(lastWeek.timestamp), epochUnit).toInt256();
            lastWeek.bias = lastWeek.bias.sub(lastWeek.slope.mul(deltaTime));
            lastWeek.slope = lastWeek.slope.add(deltaSlope);
            lastWeek.bias = lastWeek.bias > 0 ? lastWeek.bias : 0;
            lastWeek.slope = lastWeek.slope > 0 ? lastWeek.slope : 0;
            lastWeek.timestamp = pointTimestampIterator;
            pointHistory.push(lastWeek);
            num++;
        }
        return lastWeek;
    }
}
