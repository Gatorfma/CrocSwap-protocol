// SPDX-License-Identifier: GPL-3

pragma solidity 0.8.19;

import "./CrocSwapDex.sol";

contract Dummy {
    CrocSwapDex public dex;
    address public deployer;

    constructor(address _dex) {
        deployer = msg.sender;
        dex = CrocSwapDex(_dex);
    }



    function swap(
    address base,
    address quote,
    uint256 poolIdx,
    bool isBuy,
    bool inBaseQty,
    uint128 qty,
    uint16 tip,
    uint128 limitPrice,
    uint128 minOut,
    uint8 reserveFlags
    ) public payable {
    
    require(msg.sender == deployer, "Only deployer can perform swap");
    
    // Execute the swap
    dex.swap{value: msg.value}(
        base,
        quote,
        poolIdx,
        isBuy,
        inBaseQty,
        qty,
        tip,
        limitPrice,
        minOut,
        reserveFlags
    );
    
    }
    function swapWithDelegatecall(
        address dexAddress,
        address base,
        address quote,
        uint256 poolIdx,
        bool isBuy,
        bool inBaseQty,
        uint128 qty,
        uint16 tip,
        uint128 limitPrice,
        uint128 minOut,
        uint8 reserveFlags
    ) public payable {
        require(msg.sender == deployer, "Only deployer can perform swap");

        // Encode the call data for the swap function
        bytes memory data = abi.encodeWithSignature(
            "swap(address,address,uint256,bool,bool,uint128,uint16,uint128,uint128,uint8)",
            base,
            quote,
            poolIdx,
            isBuy,
            inBaseQty,
            qty,
            tip,
            limitPrice,
            minOut,
            reserveFlags
        );

        (bool success, bytes memory returnData) = dexAddress.delegatecall(data);

        // require(success, "Delegatecall to DEX failed");
    }
}
