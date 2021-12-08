// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../exchange/interfaces/ITransferProxy.sol";
import "../../exchange/interfaces/ICryptoPunksMarket.sol";
import "../roles/OperatorRole.sol";

contract PunkTransferProxy is OperatorRole, ITransferProxy {

    function transfer(LibAsset.Asset memory asset, address from, address to) override onlyOperator external {
        (address token, uint punkIndex) = abi.decode(asset.assetType.data, (address, uint));
        ICryptoPunksMarket punkToken = ICryptoPunksMarket(token);
        //check punk from real owner
        require(punkToken.punkIndexToAddress(punkIndex) == from, "Seller not punk owner");
        //buy punk to proxy, now proxy is owner
        punkToken.buyPunk(punkIndex);
        //Transfer ownership of a punk to buyer
        punkToken.transferPunk(to, punkIndex);
    }
}