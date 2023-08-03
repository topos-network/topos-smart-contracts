// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./EternalStorage.sol";

import "./../interfaces/IToposCore.sol";
import "./../interfaces/IToposMessaging.sol";

import {MerklePatriciaProofVerifier} from "./MerklePatriciaProofVerifier.sol";

contract ToposMessaging is IToposMessaging, EternalStorage {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;

    // event ReceiptDecodingResult(
    //     uint256 status,
    //     uint256 cumulativeGasUsed,
    //     bytes logsBloom,
    //     address[] logsAddress,
    //     bytes32[][] logsTopics,
    //     bytes[] logsData
    // );

    // Slot names should be prefixed with some standard string
    bytes32 internal constant PREFIX_EXECUTED = keccak256("executed");

    /// @notice Internal topos core address
    address internal immutable _toposCoreAddr;

    /// @notice Constructor for ToposMessaging contract
    /// @param toposCoreAddr Address of topos core
    constructor(address toposCoreAddr) {
        if (toposCoreAddr.code.length == uint256(0)) revert InvalidToposCore();
        _toposCoreAddr = toposCoreAddr;
    }

    /// @notice Entry point for executing any message on a target subnet
    /// @param proofBlob RLP encoded proof blob
    /// @param receiptRoot Receipts root of the block
    function execute(bytes calldata proofBlob, bytes32 receiptRoot) external {
        if (_toposCoreAddr.code.length == uint256(0)) revert InvalidToposCore();

        CertificateId certId = IToposCore(_toposCoreAddr).receiptRootToCertId(receiptRoot);
        if (!IToposCore(_toposCoreAddr).certificateExists(certId)) revert CertNotPresent();

        // the raw receipt bytes are taken out of the proof
        bytes memory receiptRaw = validateMerkleProof(proofBlob, receiptRoot);
        if (receiptRaw.length == uint256(0)) revert InvalidMerkleProof();

        bytes32 receiptHash = keccak256(abi.encodePacked(receiptRaw));
        if (_isTxExecuted(receiptHash, receiptRoot)) revert TransactionAlreadyExecuted();

        (
            uint256 status, // uint256 cumulativeGasUsed // bytes memory logsBloom
            ,
            ,
            address[] memory logsAddress,
            bytes32[][] memory logsTopics,
            bytes[] memory logsData
        ) = _decodeReceipt(receiptRaw);
        if (status != 1) revert InvalidTransaction();

        // the last event (CrossSubnetMessageSent) is always emitted by the topos core contract
        uint256 logIndex = logsAddress.length - 1;
        // check that the first log address is the address of the topos core contract
        if (logsAddress[logIndex] != _toposCoreAddr) revert InvalidToposCoreAddress();

        // first topic is the event signature & second topic is the target subnet id
        bytes32 targetSubnetId = logsTopics[logIndex][1];
        if (SubnetId.unwrap(IToposCore(_toposCoreAddr).networkSubnetId()) != targetSubnetId) revert InvalidSubnetId();

        // prevent re-entrancy
        _setTxExecuted(receiptHash, receiptRoot);
        _execute(logsData[logIndex]);
    }

    /// @notice Get the address of topos core contract
    function toposCore() public view returns (address) {
        return _toposCoreAddr;
    }

    /// @notice Validate a Merkle proof for an external transaction receipt
    /// @param proofBlob RLP encoded proof blob
    /// @param receiptRoot Receipts root of the block
    function validateMerkleProof(
        bytes memory proofBlob,
        bytes32 receiptRoot
    ) public pure override returns (bytes memory receiptRaw) {
        Proof memory proof = _decodeProofBlob(proofBlob);
        if (proof.kind != 1) revert UnsupportedProofKind();
        receiptRaw = MerklePatriciaProofVerifier.extractProofValue(receiptRoot, proof.mptKey, proof.stack);
    }

    /// @notice Execute the message on a target subnet
    /// @dev This function should be implemented by the child contract
    /// @param receiptData RLP encoded receipt data
    function _execute(bytes memory receiptData) internal virtual {}

    /// @notice emit a message sent event from the ToposCore contract
    function _emitMessageSentEvent(SubnetId targetSubnetId, bytes memory data) internal {
        IToposCore(_toposCoreAddr).emitCrossSubnetMessage(targetSubnetId, data);
    }

    /// @notice Set a flag to indicate that the asset transfer transaction has been executed
    /// @param receiptHash receipt hash
    /// @param receiptRoot receipt root
    function _setTxExecuted(bytes32 receiptHash, bytes32 receiptRoot) internal {
        bytes32 suffix = keccak256(abi.encodePacked(receiptHash, receiptRoot));
        _setBool(_getTxExecutedKey(suffix), true);
    }

    /// @notice Get the flag to indicate that the transaction has been executed
    /// @param receiptHash receipt hash
    /// @param receiptRoot receipt root
    function _isTxExecuted(bytes32 receiptHash, bytes32 receiptRoot) internal view returns (bool) {
        bytes32 suffix = keccak256(abi.encodePacked(receiptHash, receiptRoot));
        return getBool(_getTxExecutedKey(suffix));
    }

    /// @notice Validate that the target subnet id is the same as the subnet id of the topos core
    /// @param targetSubnetId Subnet id of the target subnet
    function _validateTargetSubnetId(SubnetId targetSubnetId) internal view returns (bool) {
        SubnetId toposCoreSubnetId = IToposCore(_toposCoreAddr).networkSubnetId();
        return (SubnetId.unwrap(targetSubnetId) == SubnetId.unwrap(toposCoreSubnetId));
    }

    /// @notice Get the key for the flag to indicate that the transaction has been executed
    /// @param suffix suffix of the key
    function _getTxExecutedKey(bytes32 suffix) internal pure returns (bytes32) {
        return keccak256(abi.encode(PREFIX_EXECUTED, suffix));
    }

    /// @notice Decode the proof blob into Proof struct
    /// @param proofBlob RLP encoded proof blob
    function _decodeProofBlob(bytes memory proofBlob) internal pure returns (Proof memory proof) {
        RLPReader.RLPItem[] memory proofFields = proofBlob.toRlpItem().toList();
        bytes memory rlpTxIndex = proofFields[1].toRlpBytes();
        proof = Proof(
            proofFields[0].toUint(),
            rlpTxIndex,
            proofFields[1].toUint(),
            _decodeNibbles(rlpTxIndex, 0),
            proofFields[2].toList()
        );
    }

    /// @notice Decode the nibbles from the compact bytes
    /// @param compact compact bytes to decode
    /// @param skipNibbles number of nibbles to skip
    function _decodeNibbles(bytes memory compact, uint256 skipNibbles) internal pure returns (bytes memory nibbles) {
        require(compact.length > 0);

        uint256 length = compact.length * 2;
        require(skipNibbles <= length);
        length -= skipNibbles;

        nibbles = new bytes(length);
        uint256 nibblesLength = 0;

        for (uint256 i = skipNibbles; i < skipNibbles + length; i += 1) {
            if (i % 2 == 0) {
                nibbles[nibblesLength] = bytes1((uint8(compact[i / 2]) >> 4) & 0xF);
            } else {
                nibbles[nibblesLength] = bytes1((uint8(compact[i / 2]) >> 0) & 0xF);
            }
            nibblesLength += 1;
        }

        assert(nibblesLength == nibbles.length);
    }

    /// @notice Decode the receipt into its components
    /// @param receiptRaw RLP encoded receipt
    function _decodeReceipt(
        bytes memory receiptRaw
    )
        internal
        pure
        returns (
            uint256 status,
            uint256 cumulativeGasUsed,
            bytes memory logsBloom,
            address[] memory logsAddress,
            bytes32[][] memory logsTopics,
            bytes[] memory logsData
        )
    {
        RLPReader.RLPItem[] memory receipt = receiptRaw.toRlpItem().toList();

        status = receipt[0].toUint();
        cumulativeGasUsed = receipt[1].toUint();
        logsBloom = receipt[2].toBytes();

        RLPReader.RLPItem[] memory logs = receipt[3].toList();
        logsAddress = new address[](logs.length);
        logsTopics = new bytes32[][](logs.length);
        logsData = new bytes[](logs.length);

        for (uint256 i = 0; i < logs.length; i++) {
            RLPReader.RLPItem[] memory log = logs[i].toList();
            logsAddress[i] = log[0].toAddress();

            RLPReader.RLPItem[] memory topics = log[1].toList();
            bytes32[] memory topicArray = new bytes32[](topics.length);
            for (uint256 j = 0; j < topics.length; j++) {
                topicArray[j] = bytes32(topics[j].toUint());
            }
            logsTopics[i] = topicArray;

            logsData[i] = log[2].toBytes();
        }
    }
}
