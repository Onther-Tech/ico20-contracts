// SPDX-License-Identifier: Unlicense
pragma solidity >=0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";

import "../interfaces/ILockTOSDividend.sol";
import "../interfaces/ILockTOS.sol";
import "../libraries/LibLockTOSDividend.sol";

import "../common/AccessibleCommon.sol";
import "./LockTOSDividendStorage.sol";

contract LockTOSDividend is LockTOSDividendStorage, AccessibleCommon, ILockTOSDividend {
    event Claim(address token, uint256 amount, uint256 timestamp);
    event Distribute(address token, uint256 amount);
    event Redistribute(address token, uint256 oldEpoch, uint256 newEpoch);

    using SafeMath for uint256;
    using SafeCast for uint256;

    constructor(address _lockTOS) {
        lockTOS = _lockTOS;
        genesis = block.timestamp.div(ONE_WEEK).mul(ONE_WEEK);
    }

    /// @dev Check if a function is used or not
    modifier ifFree {
        require(free == 1, "LockId is already in use");
        free = 0;
        _;
        free = 1;
    }

    /// @inheritdoc ILockTOSDividend
    function claim(address _token) override external {
        _claimUpTo(_token, block.timestamp);
    }

    /// @inheritdoc ILockTOSDividend
    function claimUpTo(address _token, uint256 _timestamp) override external {
        _claimUpTo(_token, _timestamp);
    }

    /// @inheritdoc ILockTOSDividend
    function distribute(address _token, uint256 _amount) override external ifFree {
        LibLockTOSDividend.Distribution storage distr = distributions[_token];

        distr.totalDistribution = distr.totalDistribution.add(_amount);

        uint256 weeklyEpoch = getCurrentWeeklyEpoch();
        distr.tokensPerWeek[weeklyEpoch] = distr.tokensPerWeek[weeklyEpoch].add(_amount);

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        emit Distribute(_token, _amount);
    }

    /// @inheritdoc ILockTOSDividend
    function redistribute(address _token, uint256 _weeklyEpoch) override external {
        require(_weeklyEpoch < getCurrentWeeklyEpoch());
        uint256 timestamp = (genesis + _weeklyEpoch * ONE_WEEK) + ONE_WEEK;

        require(
            ILockTOS(lockTOS).totalSupplyAt(timestamp) == 0,
            "Locked Token exists for that epoch"
        );

        uint256 newEpoch = _weeklyEpoch.add(1);
        uint256 newTimestamp = timestamp.add(ONE_WEEK);
        while (newTimestamp <= block.timestamp) {
            if (ILockTOS(lockTOS).totalSupplyAt(newTimestamp) > 0) {
                break;
            }
            newTimestamp = newTimestamp.add(ONE_WEEK);
            newEpoch = newEpoch.add(1);
        }
        require(newTimestamp <= block.timestamp, "Cannot find epoch to redistribute");
        
        LibLockTOSDividend.Distribution storage distr = distributions[_token];
        distr.tokensPerWeek[newEpoch] = distr.tokensPerWeek[newEpoch].add(distr.tokensPerWeek[_weeklyEpoch]);
        distr.tokensPerWeek[_weeklyEpoch] = 0;

        emit Redistribute(_token, _weeklyEpoch, newEpoch);
    }

    /// @inheritdoc ILockTOSDividend
    function getWeeklyEpoch(uint256 _timestamp)
        public
        view
        override
        returns (uint256)
    {
        return (_timestamp.sub(genesis)).div(ONE_WEEK);
    }

    /// @inheritdoc ILockTOSDividend
    function tokensPerWeekAt(address _token, uint256 _timestamp)
        override
        external
        view
        returns (uint256)
    {
        uint256 weeklyEpoch = getWeeklyEpoch(_timestamp);
        return distributions[_token].tokensPerWeek[weeklyEpoch];
    }

    /// @inheritdoc ILockTOSDividend
    function claimStartWeeklyEpoch(address _token, uint256 _lockId)
        override
        external
        view
        returns (uint256)
    {
        return distributions[_token].claimStartWeeklyEpoch[_lockId];
    }

    /// @inheritdoc ILockTOSDividend
    function getCurrentWeeklyEpoch()
        public
        view
        override
        returns (uint256)
    {
        return getWeeklyEpoch(block.timestamp);
    }

    /// @inheritdoc ILockTOSDividend
    function claimable(address _token) override public view returns (uint256) {
        return claimableForPeriod(_token, 0, block.timestamp);
    }

    /// @inheritdoc ILockTOSDividend
    function claimableForPeriod(
        address _token,
        uint256 _timeStart,
        uint256 _timeEnd
    )
        override
        public
        view
        returns (uint256)
    {
        uint256 epochStart = getWeeklyEpoch(_timeStart);
        uint256 epochEnd = getWeeklyEpoch(_timeEnd);
        if (epochEnd == 0) {
            return 0;            
        }

        uint256[] memory userLocks = ILockTOS(lockTOS).locksOf(msg.sender);
        uint256 amountToClaim = 0;
        LibLockTOSDividend.Distribution storage distr = distributions[_token];
        for (uint256 i = 0; i < userLocks.length; ++i) {
            uint256 lockId = userLocks[i];
            amountToClaim += _calculateClaim(distr, lockId, epochStart, epochEnd);
        }
        return amountToClaim;
    }

    /// @dev Claim rewards
    function _claimUpTo(address _token, uint256 _timestamp) internal ifFree {
        uint256 weeklyEpoch = getWeeklyEpoch(_timestamp);
        uint256[] memory userLocks = ILockTOS(lockTOS).locksOf(msg.sender);
        uint256 amountToClaim = 0;
        for (uint256 i = 0; i < userLocks.length; ++i) {
            amountToClaim += _recordClaim(_token, userLocks[i], weeklyEpoch);
        }
        if (amountToClaim > 0) {
            IERC20(_token).transfer(msg.sender, amountToClaim);   
        }
        emit Claim(_token, amountToClaim, _timestamp);
    }

    /// @dev Record claim
    function _recordClaim(
        address _token,
        uint256 _lockId,
        uint256 _weeklyEpoch
    ) internal returns (uint256 amountToClaim) {
        LibLockTOSDividend.Distribution storage distr = distributions[_token];
        amountToClaim = _calculateClaim(distr, _lockId, distr.claimStartWeeklyEpoch[_lockId], _weeklyEpoch);

        distr.claimStartWeeklyEpoch[_lockId] = _weeklyEpoch.add(1);
        distr.totalDistribution = distr.totalDistribution.sub(amountToClaim);
        return amountToClaim;
    }

    /// @dev Amount claimable
    function _calculateClaim(
        LibLockTOSDividend.Distribution storage _distr,
        uint256 _lockId,
        uint256 _startEpoch,
        uint256 _endEpoch
    ) internal view returns (uint256) {
        (uint256 start, uint256 end, , ) = ILockTOS(lockTOS).locksInfo(_lockId);
        uint256 epochIterator = Math.max(_startEpoch, getWeeklyEpoch(start));
        uint256 epochLimit = Math.min(_endEpoch, getWeeklyEpoch(end));
        uint256 accumulated = 0;
        while (epochIterator <= epochLimit) {
            accumulated = accumulated.add(
                _calculateClaimPerEpoch(
                    _lockId, epochIterator, _distr.tokensPerWeek[epochIterator]
                )
            );
            epochIterator = epochIterator.add(1);
        }
        return accumulated;
    }

    /// @dev Calculates claim portion
    function _calculateClaimPerEpoch(
        uint256 _lockId,
        uint256 _weeklyEpoch,
        uint256 _tokensPerWeek
    ) internal view returns (uint256) {
        uint256 timestamp = genesis.add(_weeklyEpoch.mul(ONE_WEEK)).add(ONE_WEEK);
        uint256 balance = ILockTOS(lockTOS).balanceOfLockAt(_lockId, timestamp);
        uint256 supply = ILockTOS(lockTOS).totalSupplyAt(timestamp);
        if (balance == 0 || supply == 0) {
            return 0;
        }
        return _tokensPerWeek.mul(balance).div(supply);
    }
}