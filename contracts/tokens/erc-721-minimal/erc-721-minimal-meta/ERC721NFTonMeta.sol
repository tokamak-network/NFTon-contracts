// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../meta-tx/EIP712MetaTransaction.sol";
import "../ERC721NFTonMinimal.sol";

contract ERC721NFTonMeta is ERC721NFTonMinimal, EIP712MetaTransaction {

    event CreateERC721NFTonMeta(address owner, string name, string symbol);
    event CreateERC721NFTonUserMeta(address owner, string name, string symbol);

    function __ERC721NFTonUserMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy) external initializer {
        __ERC721NFTon_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        for(uint i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }

        __MetaTransaction_init_unchained("ERC721NFTonUserMeta", "1");

        isPrivate = true;

        emit CreateERC721NFTonUserMeta(_msgSender(), _name, _symbol);
    }

    function __ERC721NFTonMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) external initializer {
        __ERC721NFTon_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        __MetaTransaction_init_unchained("ERC721NFTonMeta", "1");

        isPrivate = false;

        emit CreateERC721NFTonMeta(_msgSender(), _name, _symbol);
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }
}
