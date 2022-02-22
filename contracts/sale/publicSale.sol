// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/ILockTOS.sol";
import "../interfaces/IPublicSale.sol";
import "../interfaces/IWTON.sol";
import "../common/AccessibleCommon.sol";
import "./PublicSaleStorage.sol";

import { OnApprove } from "./OnApprove.sol";

contract PublicSale is
    PublicSaleStorage,
    AccessibleCommon,
    ReentrancyGuard,
    OnApprove,
    IPublicSale
{
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    event AddedWhiteList(address indexed from, uint256 tier);
    event ExclusiveSaled(address indexed from, uint256 amount);
    event Deposited(address indexed from, uint256 amount);

    event Claimed(address indexed from, uint256 amount);
    event Withdrawal(address indexed from, uint256 amount);
    event DepositWithdrawal(address indexed from, uint256 amount);

    modifier nonZero(uint256 _value) {
        require(_value > 0, "PublicSale: zero");
        _;
    }

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "PublicSale: zero address");
        _;
    }

    modifier beforeStartAddWhiteTime() {
        require(
            startAddWhiteTime == 0 ||
                (startAddWhiteTime > 0 && block.timestamp < startAddWhiteTime),
            "PublicSale: not beforeStartAddWhiteTime"
        );
        _;
    }

    modifier beforeEndAddWhiteTime() {
        require(
            endAddWhiteTime == 0 ||
                (endAddWhiteTime > 0 && block.timestamp < endAddWhiteTime),
            "PublicSale: not beforeEndAddWhiteTime"
        );
        _;
    }

    modifier greaterThan(uint256 _value1, uint256 _value2) {
        require(_value1 > _value2, "PublicSale: non greaterThan");
        _;
    }

    modifier lessThan(uint256 _value1, uint256 _value2) {
        require(_value1 < _value2, "PublicSale: non less than");
        _;
    }

    /// @inheritdoc IPublicSale
    function changeTONOwner(address _address) external override onlyOwner {
        getTokenOwner = _address;
    }

    function resetAllData() external onlyOwner {
        startAddWhiteTime = 0;
        totalWhitelists = 0;
        totalExSaleAmount = 0;
        totalExPurchasedAmount = 0;
        totalDepositAmount = 0;
        totalUsers = 0;
        totalRound1Users = 0;
        totalRound2Users = 0;
        totalRound2UsersClaim = 0;

        for (uint256 i = 0; i < whitelists.length; i++) {
            UserInfoEx storage userEx = usersEx[whitelists[i]];
            userEx.join = false;
            userEx.payAmount = 0;
            userEx.saleAmount = 0;
            UserClaim storage userClaim = usersClaim[whitelists[i]];
            userClaim.claimAmount = 0;
            userClaim.refundAmount = 0;
            userClaim.exec = false;
        }
        for (uint256 j = 0; j < depositors.length; j++) {
            UserInfoOpen storage userOpen = usersOpen[depositors[j]];
            userOpen.depositAmount = 0;
            userOpen.join = false;
            userOpen.payAmount = 0;
            userOpen.saleAmount = 0;
            UserClaim storage userClaim = usersClaim[depositors[j]];
            userClaim.claimAmount = 0;
            userClaim.refundAmount = 0;
            userClaim.exec = false;
        }
        for (uint256 k = 1; k < 5; k++) {
            tiersAccount[k] = 0;
            tiersExAccount[k] = 0;
        }
    }

    function setAllsetting(
        uint256[8] calldata _Tier,
        uint256[4] calldata _amount,
        uint256[8] calldata _time,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimPercents
    ) external onlyOwner beforeStartAddWhiteTime {
        setTier(
            _Tier[0],_Tier[1],_Tier[2],_Tier[3]
        );
        setTierPercents(
            _Tier[4],_Tier[5],_Tier[6],_Tier[7]
        );
        setSaleAmount(
            _amount[0],
            _amount[1]
        );
        setTokenPrice(
            _amount[2],
            _amount[3]
        ); 
        setSnapshot(_time[0]);
        setExclusiveTime(
            _time[1],
            _time[2],
            _time[3],
            _time[4]
        );
        setOpenTime(
            _time[5],
            _time[6]
        );
        setEachClaim(
            _time[7],
            _claimTimes,
            _claimPercents
        );
    }

    /// @inheritdoc IPublicSale
    function setSnapshot(uint256 _snapshot)
        public
        override
        onlyOwner
        nonZero(_snapshot)
    {
        snapshot = _snapshot;
    }

    /// @inheritdoc IPublicSale
    function setExclusiveTime(
        uint256 _startAddWhiteTime,
        uint256 _endAddWhiteTime,
        uint256 _startExclusiveTime,
        uint256 _endExclusiveTime
    )
        public
        override
        onlyOwner
        nonZero(_startAddWhiteTime)
        nonZero(_endAddWhiteTime)
        nonZero(_startExclusiveTime)
        nonZero(_endExclusiveTime)
        beforeStartAddWhiteTime
    {
        require(
            (_startAddWhiteTime < _endAddWhiteTime) &&
                (_startExclusiveTime < _endExclusiveTime)
        );
        startAddWhiteTime = _startAddWhiteTime;
        endAddWhiteTime = _endAddWhiteTime;
        startExclusiveTime = _startExclusiveTime;
        endExclusiveTime = _endExclusiveTime;
    }

    /// @inheritdoc IPublicSale
    function setOpenTime(
        uint256 _startDepositTime,
        uint256 _endDepositTime
    )
        public
        override
        onlyOwner
        nonZero(_startDepositTime)
        nonZero(_endDepositTime)
        beforeStartAddWhiteTime
    {
        require(
            (_startDepositTime < _endDepositTime)
        );
        startDepositTime = _startDepositTime;
        endDepositTime = _endDepositTime;
    }

    function setEachClaim(
        uint256 _claimCounts,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimPercents
    )
        public
        onlyOwner
        beforeStartAddWhiteTime
    {
        totalClaimCounts = _claimCounts;
        uint256 i = 0;
        uint256 y = 0;
        for(i = 0; i < _claimCounts; i++) {
            claimTimes.push(_claimTimes[i]);
            if(i != 0){
                require(claimTimes[i-1] < claimTimes[i], "PublicSale: time value error");
            }
            claimPercents.push(_claimPercents[i]);
            y = y + _claimPercents[i];
        }

        require(y == 100, "the percents sum are needed 100");
    }

    /// @inheritdoc IPublicSale
    function setAllTier(
        uint256[4] calldata _tier,
        uint256[4] calldata _tierPercent
    ) external override onlyOwner {
        setTier(
            _tier[0],
            _tier[1],
            _tier[2],
            _tier[3]
        );
        setTierPercents(
            _tierPercent[0],
            _tierPercent[1],
            _tierPercent[2],
            _tierPercent[3]
        );
    }

    /// @inheritdoc IPublicSale
    function setTier(
        uint256 _tier1,
        uint256 _tier2,
        uint256 _tier3,
        uint256 _tier4
    )
        public
        override
        onlyOwner
        nonZero(_tier1)
        nonZero(_tier2)
        nonZero(_tier3)
        nonZero(_tier4)
        beforeStartAddWhiteTime
    {
        tiers[1] = _tier1;
        tiers[2] = _tier2;
        tiers[3] = _tier3;
        tiers[4] = _tier4;
    }

    /// @inheritdoc IPublicSale
    function setTierPercents(
        uint256 _tier1,
        uint256 _tier2,
        uint256 _tier3,
        uint256 _tier4
    )
        public
        override
        onlyOwner
        nonZero(_tier1)
        nonZero(_tier2)
        nonZero(_tier3)
        nonZero(_tier4)
        beforeStartAddWhiteTime
    {
        require(
            _tier1.add(_tier2).add(_tier3).add(_tier4) == 10000,
            "PublicSale: Sum should be 10000"
        );
        tiersPercents[1] = _tier1;
        tiersPercents[2] = _tier2;
        tiersPercents[3] = _tier3;
        tiersPercents[4] = _tier4;
    }

    /// @inheritdoc IPublicSale
    function setAllAmount(
        uint256[2] calldata _expectAmount,
        uint256[2] calldata _priceAmount
    ) external override onlyOwner {
        setSaleAmount(
            _expectAmount[0],
            _expectAmount[1]
        );
        setTokenPrice(
            _priceAmount[0],
            _priceAmount[1]
        );
    }

    /// @inheritdoc IPublicSale
    function setSaleAmount(
        uint256 _totalExpectSaleAmount,
        uint256 _totalExpectOpenSaleAmount
    )
        public
        override
        onlyOwner
        nonZero(_totalExpectSaleAmount.add(_totalExpectOpenSaleAmount))
        beforeStartAddWhiteTime
    {
        totalExpectSaleAmount = _totalExpectSaleAmount;
        totalExpectOpenSaleAmount = _totalExpectOpenSaleAmount;
    }

    /// @inheritdoc IPublicSale
    function setTokenPrice(uint256 _saleTokenPrice, uint256 _payTokenPrice)
        public
        override
        onlyOwner
        nonZero(_saleTokenPrice)
        nonZero(_payTokenPrice)
        beforeStartAddWhiteTime
    {
        saleTokenPrice = _saleTokenPrice;
        payTokenPrice = _payTokenPrice;
    }

    /// @inheritdoc IPublicSale
    function totalExpectOpenSaleAmountView() public view override returns(uint256){
        if(block.timestamp < endExclusiveTime) return totalExpectOpenSaleAmount;
        else return totalExpectOpenSaleAmount.add(totalRound1NonSaleAmount());
    }

    /// @inheritdoc IPublicSale
    function totalRound1NonSaleAmount() public view override returns(uint256){
        return totalExpectSaleAmount.sub(totalExSaleAmount);
    }


    function _toRAY(uint256 v) internal pure returns (uint256) {
        return v * 10 ** 9;
    }

    /// @inheritdoc IPublicSale
    function calculSaleToken(uint256 _amount)
        public
        view
        override
        returns (uint256)
    {
        uint256 tokenSaleAmount =
            _amount.mul(payTokenPrice).div(saleTokenPrice);
        return tokenSaleAmount;
    }

    /// @inheritdoc IPublicSale
    function calculPayToken(uint256 _amount)
        public
        view
        override
        returns (uint256)
    {
        uint256 tokenPayAmount = _amount.mul(saleTokenPrice).div(payTokenPrice);
        return tokenPayAmount;
    }

    /// @inheritdoc IPublicSale
    function calculTier(address _address)
        public
        view
        override
        nonZeroAddress(address(sTOS))
        nonZero(tiers[1])
        nonZero(tiers[2])
        nonZero(tiers[3])
        nonZero(tiers[4])
        returns (uint256)
    {
        uint256 sTOSBalance = sTOS.balanceOfAt(_address, snapshot);
        uint256 tier;
        if (sTOSBalance >= tiers[1] && sTOSBalance < tiers[2]) {
            tier = 1;
        } else if (sTOSBalance >= tiers[2] && sTOSBalance < tiers[3]) {
            tier = 2;
        } else if (sTOSBalance >= tiers[3] && sTOSBalance < tiers[4]) {
            tier = 3;
        } else if (sTOSBalance >= tiers[4]) {
            tier = 4;
        } else if (sTOSBalance < tiers[1]) {
            tier = 0;
        }
        return tier;
    }

    /// @inheritdoc IPublicSale
    function calculTierAmount(address _address)
        public
        view
        override
        returns (uint256)
    {
        UserInfoEx storage userEx = usersEx[_address];
        uint256 tier = calculTier(_address);
        if (userEx.join == true && tier > 0) {
            uint256 salePossible =
                totalExpectSaleAmount
                    .mul(tiersPercents[tier])
                    .div(tiersAccount[tier])
                    .div(10000);
            return salePossible;
        } else if (tier > 0) {
            uint256 tierAccount = tiersAccount[tier].add(1);
            uint256 salePossible =
                totalExpectSaleAmount
                    .mul(tiersPercents[tier])
                    .div(tierAccount)
                    .div(10000);
            return salePossible;
        } else {
            return 0;
        }
    }

    /// @inheritdoc IPublicSale
    function calculOpenSaleAmount(address _account, uint256 _amount)
        public
        view
        override
        returns (uint256)
    {
        UserInfoOpen storage userOpen = usersOpen[_account];
        uint256 depositAmount = userOpen.depositAmount.add(_amount);
        uint256 openSalePossible =
            totalExpectOpenSaleAmountView().mul(depositAmount).div(
                totalDepositAmount.add(_amount)
            );
        return openSalePossible;
    }

    function currentRound() public view returns (uint256 round) {
        for(uint256 i = totalClaimCounts; i > 0; i--) {
            if(block.timestamp < claimTimes[0]){
                round = 0;
            } else if(block.timestamp < claimTimes[i-1] && i != 0) {
                round = i-1;
            } else if (block.timestamp > claimTimes[totalClaimCounts-1]) {
                round = totalClaimCounts;
            }
        }
    }

    function calculClaimAmount(address _account, uint256 _period) 
        public 
        view 
        override
        returns (uint256 _reward, uint256 _totalClaim) 
    {
        if(block.timestamp < startClaimTime) return (0, 0);
        if(_period > totalClaimCounts) return (0, 0);
 
        UserClaim storage userClaim = usersClaim[_account];
        (, uint256 realSaleAmount, ) = totalSaleUserAmount(_account);   //유저가 총 구매한 token의 양을 Return 함

        if (realSaleAmount == 0 ) return (0, 0);
        if (userClaim.claimAmount >= realSaleAmount) return (0, 0);    //userClaim.claimAmount  = contract에서 유저에게 준양

        //해당 라운드에서 받아야하는 토큰의 양 -> (realSaleAmount * claimPercents[i] / 100) : 해당 라운드에서 받아야하는 토큰의 양
        uint256 totalClaimReward = realSaleAmount;
        uint256 round = currentRound();

        uint256 expectedClaimAmount;
        for(uint256 i = 0; i < round; i++) {
            expectedClaimAmount = expectedClaimAmount + (totalClaimReward * claimPercents[i] / 100);
        }

        //Period를 0으로 넣으면 현재 내가 받는 양을 리턴해주고 1 이상을 넣으면 해당 라운드에서 받을 수 있는 토큰의 양을 리턴해줌
        if(_period == 0) {    
            if(totalClaimCounts == round) {  
                uint256 amount = totalClaimReward - userClaim.claimAmount;
                return (amount, totalClaimReward);
            } else {
                uint256 amount = expectedClaimAmount - userClaim.claimAmount;
                return (amount, totalClaimReward);
            }   
        } else {
            uint256 amount = (totalClaimReward * claimPercents[(_period.sub(1))] / 100);
            return (amount, totalClaimReward);
        }
    }

    /// @inheritdoc IPublicSale
    function totalSaleUserAmount(address user) public override view returns (uint256 _realPayAmount, uint256 _realSaleAmount, uint256 _refundAmount) {
        UserInfoEx storage userEx = usersEx[user];

        if(userEx.join){
            (uint256 realPayAmount, uint256 realSaleAmount, uint256 refundAmount) = openSaleUserAmount(user);
            return ( realPayAmount.add(userEx.payAmount), realSaleAmount.add(userEx.saleAmount), refundAmount);
        }else {
            return openSaleUserAmount(user);
        }
    }

    /// @inheritdoc IPublicSale
    function openSaleUserAmount(address user) public override view returns (uint256 _realPayAmount, uint256 _realSaleAmount, uint256 _refundAmount) {
        UserInfoOpen storage userOpen = usersOpen[user];

        if(!userOpen.join || userOpen.depositAmount == 0) return (0, 0, 0);

        uint256 openSalePossible = calculOpenSaleAmount(user, 0);
        uint256 realPayAmount = calculPayToken(openSalePossible);
        uint256 depositAmount = userOpen.depositAmount;
        uint256 realSaleAmount = 0;
        uint256 returnAmount = 0;

        if (realPayAmount < depositAmount) {
           returnAmount = depositAmount.sub(realPayAmount);
           realSaleAmount = calculSaleToken(realPayAmount);
        } else {
            realPayAmount = userOpen.depositAmount;
            realSaleAmount = calculSaleToken(depositAmount);
        }

        return (realPayAmount, realSaleAmount, returnAmount);
    }
    
    /// @inheritdoc IPublicSale
    function totalOpenSaleAmount() public override view returns (uint256){
        uint256 _calculSaleToken = calculSaleToken(totalDepositAmount);
        uint256 _totalAmount = totalExpectOpenSaleAmountView();

        if(_calculSaleToken < _totalAmount) return _calculSaleToken;
        else return _totalAmount;
    }

    /// @inheritdoc IPublicSale
    function totalOpenPurchasedAmount() public override view returns (uint256){
        uint256 _calculSaleToken = calculSaleToken(totalDepositAmount);
        uint256 _totalAmount = totalExpectOpenSaleAmountView();
        if(_calculSaleToken < _totalAmount) return totalDepositAmount;
        else return  calculPayToken(_totalAmount);
    }

    /// @inheritdoc IPublicSale
    function addWhiteList() external override nonReentrant {
        require(
            block.timestamp >= startAddWhiteTime,
            "PublicSale: whitelistStartTime has not passed"
        );
        require(
            block.timestamp < endAddWhiteTime,
            "PublicSale: end the whitelistTime"
        );
        uint256 tier = calculTier(msg.sender);
        require(tier >= 1, "PublicSale: need to more sTOS");
        UserInfoEx storage userEx = usersEx[msg.sender];
        require(userEx.join != true, "PublicSale: already attended");

        whitelists.push(msg.sender);
        totalWhitelists = totalWhitelists.add(1);

        userEx.join = true;
        userEx.tier = tier;
        userEx.saleAmount = 0;
        tiersAccount[tier] = tiersAccount[tier].add(1);

        emit AddedWhiteList(msg.sender, tier);
    }

    /**
     * @dev transform RAY to WAD
     */
    function _toWAD(uint256 v) public override pure returns (uint256) {
        return v / 10 ** 9;
    }

    // OnApprove가 2가지 경우에 따라서 작동을 하게함.
    function onApprove(
        address sender,
        address spender,
        uint256 amount,
        bytes calldata data
    ) external override returns (bool) {
        require(msg.sender == address(getToken) || msg.sender == address(IWTON(wton)), "PublicSale: only accept TON and WTON approve callback");
        if(msg.sender == address(getToken)) {
            uint256 wtonAmount = _decodeApproveData(data);
            if(wtonAmount == 0){
                if(block.timestamp >= startExclusiveTime && block.timestamp < endExclusiveTime) {
                    exclusiveSale(sender,amount);
                } else {
                    require(block.timestamp >= startDepositTime && block.timestamp < endDepositTime, "PublicSale: not SaleTime");
                    deposit(sender,amount);
                }
            } else {
                uint256 totalAmount = amount + wtonAmount;
                if(block.timestamp >= startExclusiveTime && block.timestamp < endExclusiveTime) {
                    exclusiveSale(sender,totalAmount);
                }
                else {
                    require(block.timestamp >= startDepositTime && block.timestamp < endDepositTime, "PublicSale: not SaleTime");
                    deposit(sender,totalAmount);
                }
            }
        } else if (msg.sender == address(IWTON(wton))) {
            uint256 wtonAmount = _toWAD(amount);
            if(block.timestamp >= startExclusiveTime && block.timestamp < endExclusiveTime) {
                exclusiveSale(sender,wtonAmount);
            }
            else {
                require(block.timestamp >= startDepositTime && block.timestamp < endDepositTime, "PublicSale: not SaleTime");
                deposit(sender,wtonAmount);
            }
        }

        return true;
    }

    function _decodeApproveData(
        bytes memory data
    ) public override pure returns (uint256 approveData) {
        assembly {
            approveData := mload(add(data, 0x20))
        }
    }


    /// @inheritdoc IPublicSale
    function exclusiveSale(
        address _sender,
        uint256 _amount
    )
        public
        override
        nonZero(_amount)
        nonZero(totalClaimCounts)
        nonReentrant
    {
        require(
            block.timestamp >= startExclusiveTime,
            "PublicSale: exclusiveStartTime has not passed"
        );
        require(
            block.timestamp < endExclusiveTime,
            "PublicSale: end the exclusiveTime"
        );
        UserInfoEx storage userEx = usersEx[_sender];
        require(userEx.join == true, "PublicSale: not registered in whitelist");
        uint256 tokenSaleAmount = calculSaleToken(_amount);
        uint256 salePossible = calculTierAmount(_sender);

        require(
            salePossible >= userEx.saleAmount.add(tokenSaleAmount),
            "PublicSale: just buy tier's allocated amount"
        );

        uint256 tier = calculTier(_sender);

        if(userEx.payAmount == 0) {
            totalRound1Users = totalRound1Users.add(1);
            totalUsers = totalUsers.add(1);
            tiersExAccount[tier] = tiersExAccount[tier].add(1);
        }

        userEx.payAmount = userEx.payAmount.add(_amount);
        userEx.saleAmount = userEx.saleAmount.add(tokenSaleAmount);

        totalExPurchasedAmount = totalExPurchasedAmount.add(_amount);
        totalExSaleAmount = totalExSaleAmount.add(tokenSaleAmount);

        
        uint256 tonAllowance = getToken.allowance(_sender, address(this));
        uint256 tonBalance = getToken.balanceOf(_sender);
        if(tonAllowance > tonBalance) {
            tonAllowance = tonBalance; //tonAllowance가 tonBlance보다 더 클때 문제가 된다.
        }
        if(tonAllowance < _amount) {
            uint256 needUserWton;
            uint256 needWton = _amount.sub(tonAllowance);
            needUserWton = _toRAY(needWton);
            require(IWTON(wton).allowance(_sender, address(this)) >= needUserWton, "PublicSale: wton amount exceeds allowance");
            require(IWTON(wton).balanceOf(_sender) >= needUserWton, "need more wton");
            IERC20(wton).safeTransferFrom(_sender,address(this),needUserWton);
            IWTON(wton).swapToTON(needUserWton);
            require(tonAllowance >= _amount.sub(needWton), "PublicSale: ton amount exceeds allowance");
            if(_amount.sub(needWton) > 0) {
                getToken.safeTransferFrom(_sender, address(this), _amount.sub(needWton));   
            }
            getToken.safeTransfer(getTokenOwner, _amount);
        } else {
            require(tonAllowance >= _amount && tonBalance >= _amount, "PublicSale: ton amount exceeds allowance");

            getToken.safeTransferFrom(_sender, address(this), _amount);
            getToken.safeTransfer(getTokenOwner, _amount);
        }

        emit ExclusiveSaled(_sender, _amount);
    }

    /// @inheritdoc IPublicSale
    function deposit(
        address _sender,
        uint256 _amount
    ) 
        public 
        override 
        nonReentrant 
    {
        require(
            block.timestamp >= startDepositTime,
            "PublicSale: don't start depositTime"
        );
        require(
            block.timestamp < endDepositTime,
            "PublicSale: end the depositTime"
        );

        UserInfoOpen storage userOpen = usersOpen[_sender];

        if (!userOpen.join) {
            depositors.push(_sender);
            userOpen.join = true;

            totalRound2Users = totalRound2Users.add(1);
            UserInfoEx storage userEx = usersEx[_sender];
            if(userEx.payAmount == 0) totalUsers = totalUsers.add(1);
        }
        userOpen.depositAmount = userOpen.depositAmount.add(_amount);
        userOpen.saleAmount = 0;
        totalDepositAmount = totalDepositAmount.add(_amount);

        uint256 tonAllowance = getToken.allowance(_sender, address(this));
        uint256 tonBalance = getToken.balanceOf(_sender);
        if(tonAllowance > tonBalance) {
            tonAllowance = tonBalance; //tonAllowance가 tonBlance보다 더 클때 문제가 된다.
        }
        if(tonAllowance < _amount) {
            uint256 needUserWton;
            uint256 needWton = _amount.sub(tonAllowance);
            needUserWton = _toRAY(needWton);
            require(IWTON(wton).allowance(_sender, address(this)) >= needUserWton, "PublicSale: wton amount exceeds allowance");
            require(IWTON(wton).balanceOf(_sender) >= needUserWton, "need more wton");
            IERC20(wton).safeTransferFrom(_sender,address(this),needUserWton);
            IWTON(wton).swapToTON(needUserWton);
            require(tonAllowance >= _amount.sub(needWton), "PublicSale: ton amount exceeds allowance");
            if(_amount.sub(needWton) > 0) {
                getToken.safeTransferFrom(_sender, address(this), _amount.sub(needWton));   
            }
        } else {
            require(tonAllowance >= _amount && tonBalance >= _amount, "PublicSale: ton amount exceeds allowance");

            getToken.safeTransferFrom(_sender, address(this), _amount);
        }


        emit Deposited(_sender, _amount);
    }

    /// @inheritdoc IPublicSale
    function claim() external override {
        require(
            block.timestamp >= claimTimes[0],
            "PublicSale: don't start claimTime"
        );
        UserClaim storage userClaim = usersClaim[msg.sender];
        UserInfoOpen storage userOpen = usersOpen[msg.sender];

        (, uint256 realSaleAmount, ) = totalSaleUserAmount(msg.sender);
        (, ,uint256 refundAmount ) = openSaleUserAmount(msg.sender);

        require(
            realSaleAmount > 0,
            "PublicSale: no purchase amount"
        );

        (uint256 reward, ) = calculClaimAmount(msg.sender, 0);
        require(reward > 0, "PublicSale: no reward");
        require(
            realSaleAmount.sub(userClaim.claimAmount) >= reward,
            "PublicSale: user is already getAllreward"
        );
        require(
            saleToken.balanceOf(address(this)) >= reward,
            "PublicSale: dont have saleToken in pool"
        );

        userClaim.claimAmount = userClaim.claimAmount.add(reward);

        saleToken.safeTransfer(msg.sender, reward);

        if(!userClaim.exec && userOpen.join) {
            totalRound2UsersClaim = totalRound2UsersClaim.add(1);
            userClaim.exec = true;
        }

        if(refundAmount > 0 && userClaim.refundAmount == 0){
            require(refundAmount <= getToken.balanceOf(address(this)), "PublicSale: dont have refund ton");
            userClaim.refundAmount = refundAmount;
            getToken.safeTransfer(msg.sender, refundAmount);
        }

        emit Claimed(msg.sender, reward);
    }
    
    /// @inheritdoc IPublicSale
    function depositWithdraw() external override onlyOwner {
        require(block.timestamp > endDepositTime,"PublicSale: need to end the depositTime");
        uint256 getAmount;
        if(totalRound2Users == totalRound2UsersClaim){
            getAmount = getToken.balanceOf(address(this));
        } else {
            getAmount = totalOpenPurchasedAmount().sub(10 ether);
        }
        require(getAmount <= getToken.balanceOf(address(this)), "PublicSale: no token to receive");
        getToken.safeTransfer(getTokenOwner, getAmount);
        emit DepositWithdrawal(msg.sender, getAmount);
    }

    /// @inheritdoc IPublicSale
    function withdraw() external override onlyOwner{
        if(block.timestamp <= endDepositTime){
            uint256 balance = saleToken.balanceOf(address(this));
            require(balance > totalExpectSaleAmount.add(totalExpectOpenSaleAmount), "PublicSale: no withdrawable amount");
            uint256 withdrawAmount = balance.sub(totalExpectSaleAmount.add(totalExpectOpenSaleAmount));
            require(withdrawAmount != 0, "PublicSale: don't exist withdrawAmount");
            saleToken.safeTransfer(msg.sender, withdrawAmount);
            emit Withdrawal(msg.sender, withdrawAmount);
        } else {
            require(block.timestamp > endDepositTime, "PublicSale: end the openSaleTime");
            require(!adminWithdraw, "already admin called withdraw");
            adminWithdraw = true;
            uint256 saleAmount = totalOpenSaleAmount();
            require(totalExpectSaleAmount.add(totalExpectOpenSaleAmount) > totalExSaleAmount.add(saleAmount), "PublicSale: don't exist withdrawAmount");

            uint256 withdrawAmount = totalExpectSaleAmount.add(totalExpectOpenSaleAmount).sub(totalExSaleAmount).sub(saleAmount);

            require(withdrawAmount != 0, "PublicSale: don't exist withdrawAmount");
            saleToken.safeTransfer(msg.sender, withdrawAmount);
            emit Withdrawal(msg.sender, withdrawAmount);
        }
    }
}