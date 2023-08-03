// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "solidity-rlp/contracts/RLPReader.sol";

import {SubnetId} from "./IToposCore.sol";

interface IToposMessaging {
    struct Proof {
        uint256 kind;
        bytes rlpTxIndex;
        uint256 txIndex;
        bytes mptKey;
        RLPReader.RLPItem[] stack;
    }

    error CertNotPresent();
    error InvalidMerkleProof();
    error InvalidSubnetId();
    error InvalidTransaction();
    error InvalidToposCore();
    error InvalidToposCoreAddress();
    error TransactionAlreadyExecuted();
    error UnsupportedProofKind();

    function execute(bytes calldata proofBlob, bytes32 receiptRoot) external;

    function validateMerkleProof(
        bytes memory proofBlob,
        bytes32 receiptRoot
    ) external returns (bytes memory receiptRaw);

    function toposCore() external view returns (address);
}
