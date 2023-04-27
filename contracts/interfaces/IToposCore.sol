// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

type CertificateId is bytes32; // user-defined type for certificate IDs
type SubnetId is bytes32; // user-defined type for subnet IDs

interface IToposCore {
    struct Certificate {
        CertificateId prevId;
        SubnetId sourceSubnetId;
        bytes32 stateRoot;
        bytes32 txRoot;
        SubnetId[] targetSubnets;
        uint32 verifier;
        CertificateId certId;
        bytes starkProof;
        bytes signature;
    }
    struct StreamPosition {
        CertificateId certId;
        uint256 position;
        SubnetId sourceSubnetId;
    }

    event CertStored(CertificateId certId, bytes32 txRoot);

    event Upgraded(address indexed implementation);

    error InvalidCodeHash();
    error NotProxy();
    error SetupFailed();

    function pushCertificate(bytes calldata certBytes, uint256 position) external;

    function setNetworkSubnetId(SubnetId _networkSubnetId) external;

    function setup(bytes calldata params) external;

    function upgrade(address newImplementation, bytes32 newImplementationCodeHash, bytes calldata setupParams) external;

    function adminEpoch() external view returns (uint256);

    function admins(uint256 epoch) external view returns (address[] memory);

    function adminThreshold(uint256 epoch) external view returns (uint256);

    function certificateExists(CertificateId certId) external view returns (bool);

    function implementation() external view returns (address);

    function networkSubnetId() external view returns (SubnetId);

    function getCertIdAtIndex(uint256 index) external view returns (CertificateId);

    function getCertificate(
        CertificateId certId
    )
        external
        view
        returns (
            CertificateId,
            SubnetId,
            bytes32,
            bytes32,
            SubnetId[] memory,
            uint32,
            CertificateId,
            bytes memory,
            bytes memory,
            uint256
        );

    function getCertificateCount() external view returns (uint256);

    function getCheckpoints() external view returns (StreamPosition[] memory checkpoints);

    function getSourceSubnetIdAtIndex(uint256 index) external view returns (SubnetId);

    function getSourceSubnetIdCount() external view returns (uint256);

    function sourceSubnetIdExists(SubnetId subnetId) external view returns (bool);

    function txRootToCertId(bytes32 txRoot) external view returns (CertificateId);
}
