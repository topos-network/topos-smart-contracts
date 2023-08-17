import { ethers } from 'hardhat'
import { expect } from 'chai'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import * as cc from './shared/constants/certificates'
import * as testUtils from './shared/utils/common'

describe('ToposCore', () => {
  async function deployToposCoreFixture() {
    const [admin] = await ethers.getSigners()
    const defaultCert = testUtils.encodeCertParam(
      cc.PREV_CERT_ID_0,
      cc.SOURCE_SUBNET_ID_1,
      cc.STATE_ROOT_MAX,
      cc.TX_ROOT_MAX,
      [cc.TARGET_SUBNET_ID_4, cc.TARGET_SUBNET_ID_5],
      cc.VERIFIER,
      cc.CERT_ID_1,
      cc.DUMMY_STARK_PROOF,
      cc.DUMMY_SIGNATURE
    )
    const adminAddresses = [admin.address]
    const adminThreshold = 1

    const ToposCore = await ethers.getContractFactory('ToposCore')
    const ToposCoreProxy = await ethers.getContractFactory('ToposCoreProxy')

    const toposCoreImplementation = await ToposCore.deploy()
    const toposCoreProxy = await ToposCoreProxy.deploy(
      toposCoreImplementation.address
    )
    const toposCore = ToposCore.attach(toposCoreProxy.address)
    await toposCore.initialize(adminAddresses, adminThreshold)

    const altToposCoreImplementation = await ToposCore.deploy()
    const altToposCoreProxy = await ToposCoreProxy.deploy(
      altToposCoreImplementation.address
    )
    const altToposCore = ToposCore.attach(altToposCoreProxy.address)

    return {
      altToposCore,
      altToposCoreImplementation,
      admin,
      adminAddresses,
      adminThreshold,
      defaultCert,
      toposCore,
      toposCoreImplementation,
    }
  }

  describe('initialize', () => {
    it('reverts if implementation contract has already been initialized', async () => {
      const { adminAddresses, adminThreshold, toposCore } = await loadFixture(
        deployToposCoreFixture
      )
      await expect(
        toposCore.initialize(adminAddresses, adminThreshold)
      ).to.be.revertedWith('Initializable: contract is already initialized')
    })

    it('reverts if the admin threshold mismatch the length of the admin list', async () => {
      const { adminAddresses, altToposCore } = await loadFixture(
        deployToposCoreFixture
      )
      const falseAdminThreshold = 2 // admin threshold is 2, but we supply one admin address
      await expect(
        altToposCore.initialize(adminAddresses, falseAdminThreshold)
      ).to.be.revertedWithCustomError(altToposCore, 'InvalidAdmins')
    })

    it('reverts if the admin threshold is zero', async () => {
      const { adminAddresses, altToposCore } = await loadFixture(
        deployToposCoreFixture
      )
      const falseAdminThreshold = 0 // admin threshold is 0, but we supply one admin address
      await expect(
        altToposCore.initialize(adminAddresses, falseAdminThreshold)
      ).to.be.revertedWithCustomError(altToposCore, 'InvalidAdminThreshold')
    })

    it('reverts if trying to add duplicate admins', async () => {
      const { admin, adminThreshold, altToposCore } = await loadFixture(
        deployToposCoreFixture
      )
      const adminAddresses = [admin.address, admin.address] // duplicate admins
      await expect(
        altToposCore.initialize(adminAddresses, adminThreshold)
      ).to.to.be.revertedWithCustomError(altToposCore, 'DuplicateAdmin')
    })

    it('reverts if the admin address is zero address', async () => {
      const { adminThreshold, altToposCore } = await loadFixture(
        deployToposCoreFixture
      )
      const adminAddresses = [ethers.constants.AddressZero] // zero address admin
      await expect(
        altToposCore.initialize(adminAddresses, adminThreshold)
      ).to.to.be.revertedWithCustomError(altToposCore, 'InvalidAdmins')
    })
  })

  describe('pushCertificate', () => {
    it('reverts if the certificate is already stored', async () => {
      const { defaultCert, toposCore } = await loadFixture(
        deployToposCoreFixture
      )
      await toposCore.pushCertificate(defaultCert, cc.CERT_POS_1)
      await expect(
        toposCore.pushCertificate(defaultCert, cc.CERT_POS_1)
      ).to.be.revertedWith('Bytes32Set: key already exists in the set.')
    })

    it('reverts if non-admin tries to push certificate', async () => {
      const { defaultCert, toposCore } = await loadFixture(
        deployToposCoreFixture
      )
      const [, nonAdmin] = await ethers.getSigners()
      await expect(
        toposCore.connect(nonAdmin).pushCertificate(defaultCert, cc.CERT_POS_1)
      ).to.be.revertedWithCustomError(toposCore, 'NotAdmin')
    })

    it('gets the certificate count', async () => {
      const { defaultCert, toposCore } = await loadFixture(
        deployToposCoreFixture
      )
      await toposCore.pushCertificate(defaultCert, cc.CERT_POS_1)
      expect(await toposCore.getCertificateCount()).to.equal(1)
    })

    it('gets count for multiple certificates', async () => {
      const { toposCore } = await loadFixture(deployToposCoreFixture)
      const testCheckpoints = [
        [cc.CERT_ID_1, cc.CERT_POS_1, cc.SOURCE_SUBNET_ID_1],
        [cc.CERT_ID_2, cc.CERT_POS_2, cc.SOURCE_SUBNET_ID_2],
      ]

      for (const checkpoint of testCheckpoints) {
        const certificate = testUtils.encodeCertParam(
          cc.PREV_CERT_ID_0,
          checkpoint[2].toString(),
          cc.STATE_ROOT_MAX,
          cc.TX_ROOT_MAX,
          [cc.TARGET_SUBNET_ID_4],
          cc.VERIFIER,
          checkpoint[0].toString(),
          cc.DUMMY_STARK_PROOF,
          cc.DUMMY_SIGNATURE
        )
        await toposCore.pushCertificate(certificate, checkpoint[1])
      }
      expect(await toposCore.getCertificateCount()).to.equal(2)
    })

    it('gets the certificate at a given index', async () => {
      const { defaultCert, toposCore } = await loadFixture(
        deployToposCoreFixture
      )
      await toposCore.pushCertificate(defaultCert, cc.CERT_POS_1)
      const certificate = await toposCore.getCertIdAtIndex(0)
      expect(certificate).to.equal(cc.CERT_ID_1)
    })

    it('updates the source subnet set correctly', async () => {
      const { toposCore } = await loadFixture(deployToposCoreFixture)
      const testCheckpoints = [
        [cc.CERT_ID_1, cc.CERT_POS_1, cc.SOURCE_SUBNET_ID_1],
        [cc.CERT_ID_2, cc.CERT_POS_2, cc.SOURCE_SUBNET_ID_2],
        [cc.CERT_ID_3, cc.CERT_POS_3, cc.SOURCE_SUBNET_ID_3],
      ]

      for (const checkpoint of testCheckpoints) {
        const certificate = testUtils.encodeCertParam(
          cc.PREV_CERT_ID_0,
          checkpoint[2].toString(),
          cc.STATE_ROOT_MAX,
          cc.TX_ROOT_MAX,
          [cc.TARGET_SUBNET_ID_4],
          cc.VERIFIER,
          checkpoint[0].toString(),
          cc.DUMMY_STARK_PROOF,
          cc.DUMMY_SIGNATURE
        )
        await toposCore.pushCertificate(certificate, checkpoint[1])
      }

      const encodedCheckpoints = await toposCore.getCheckpoints()
      const checkpoints = encodedCheckpoints.map((checkpoint) => {
        return [checkpoint[0], checkpoint[1].toNumber(), checkpoint[2]]
      })
      testCheckpoints.map((innerArr1, i) =>
        innerArr1.map((item, j) => expect(item).to.equal(checkpoints[i][j]))
      )
      const updatedTestCheckpoint = [
        cc.CERT_ID_4,
        cc.CERT_POS_4,
        cc.SOURCE_SUBNET_ID_2,
      ]
      const updatedCertificate = testUtils.encodeCertParam(
        cc.PREV_CERT_ID_0,
        updatedTestCheckpoint[2].toString(),
        cc.STATE_ROOT_MAX,
        cc.TX_ROOT_MAX,
        [cc.TARGET_SUBNET_ID_4],
        cc.VERIFIER,
        updatedTestCheckpoint[0].toString(),
        cc.DUMMY_STARK_PROOF,
        cc.DUMMY_SIGNATURE
      )
      await toposCore.pushCertificate(
        updatedCertificate,
        updatedTestCheckpoint[1]
      )
      const updatedEncodedCheckpoints = await toposCore.getCheckpoints()
      const updatedCheckpoints = updatedEncodedCheckpoints.map((checkpoint) => {
        return [checkpoint[0], checkpoint[1].toNumber(), checkpoint[2]]
      })
      testCheckpoints[1] = updatedTestCheckpoint
      testCheckpoints.map((innerArr1, i) =>
        innerArr1.map((item, j) =>
          expect(item).to.equal(updatedCheckpoints[i][j])
        )
      )
    })

    it('emits a certificate stored event', async () => {
      const { defaultCert, toposCore } = await loadFixture(
        deployToposCoreFixture
      )
      const tx = await toposCore.pushCertificate(defaultCert, cc.CERT_POS_1)
      await expect(tx)
        .to.emit(toposCore, 'CertStored')
        .withArgs(cc.CERT_ID_1, cc.TX_ROOT_MAX)
    })
  })

  describe('proxy', () => {
    it('reverts if the ToposCore implementation contract is not present', async () => {
      const ToposCoreProxy = await ethers.getContractFactory('ToposCoreProxy')
      await expect(ToposCoreProxy.deploy(ethers.constants.AddressZero)).to.be
        .reverted
    })
  })

  describe('upgrade', () => {
    it('reverts if the code hash does not match', async () => {
      const { toposCore, altToposCore } = await loadFixture(
        deployToposCoreFixture
      )
      const emptyCodeHash =
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      await expect(
        toposCore.upgrade(altToposCore.address, emptyCodeHash)
      ).to.be.revertedWithCustomError(toposCore, 'InvalidCodeHash')
    })

    it('emits an upgraded event', async () => {
      const { admin, altToposCoreImplementation, toposCore } =
        await loadFixture(deployToposCoreFixture)
      expect(await toposCore.implementation()).to.not.equal(
        altToposCoreImplementation.address
      )

      const CodeHash = await ethers.getContractFactory('CodeHash')
      const codeHash = await CodeHash.deploy()
      const implementationCodeHash = await codeHash.getCodeHash(
        altToposCoreImplementation.address
      )

      await expect(
        toposCore.upgrade(
          altToposCoreImplementation.address,
          implementationCodeHash
        )
      )
        .to.emit(toposCore, 'Upgraded')
        .withArgs(altToposCoreImplementation.address)
      expect(await toposCore.implementation()).to.equal(
        altToposCoreImplementation.address
      )
      const currentAdmins = await toposCore.admins(1)
      expect(currentAdmins[0]).to.equal(admin.address) // check that the admin is unchanged
    })
  })
})
