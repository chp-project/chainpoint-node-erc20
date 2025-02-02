/* global describe, it, before */

process.env.NODE_ENV = 'test'

const jwt = require('jsonwebtoken')
const ECDSA = require('ecdsa-secp256r1')

// test related packages
const expect = require('chai').expect

const usageToken = require('../lib/usage-token.js')

describe('Usage Token Methods', () => {
  describe('getActiveUsageTokenAsync', () => {
    let coreIPs = ['65.1.1.1', '65.1.1.2', '65.1.1.3']
    before(() => {
      usageToken.setENV({ PRIVATE_NETWORK: false })
      usageToken.setCores({ getCoreConnectedIPs: () => coreIPs })
    })
    const payload = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 27,
      aud: coreIPs.join(',')
    }
    const privateKey = ECDSA.generateKey()
    const token = jwt.sign(payload, privateKey.toPEM(), { algorithm: 'ES256' })
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => token
      })
    })
    it('should return token with valid token saved', async () => {
      let activeToken = await usageToken.getActiveUsageTokenAsync()
      expect(activeToken).to.equal(token)
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    const payloadNew = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 99
    }
    const privateKey = ECDSA.generateKey()
    const newToken = jwt.sign(payloadNew, privateKey.toPEM(), { algorithm: 'ES256' })
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => null
      })
      usageToken.setCores({
        getETHStatsByAddressAsync: () => {
          return { creditPrice: 100, gasPrice: 20, transactionCount: 54 }
        },
        purchaseCreditsAsync: () => newToken
      })
      usageToken.setENV({
        AUTO_REFILL_ENABLED: false,
        AUTO_REFILL_AMOUNT: 100,
        NODE_ETH_ADDRESS: '0x99Be343B94f860125bC4fEe278FDCBD38C102D88',
        NODE_ETH_PRIVATE_KEY: '0x308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b02',
        PRIVATE_NETWORK: false
      })
      let updatedTknDefinition = usageToken.tknDefinition
      updatedTknDefinition.networks['1'] = updatedTknDefinition.networks['3']
      usageToken.setTknDefinition(updatedTknDefinition)
    })
    it('should throw error no valid token and auto acquire off', async () => {
      let err = null
      try {
        await usageToken.getActiveUsageTokenAsync()
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Unable to get active token : No valid usage token in use : Auto acquire new token disabled')
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => null
      })
      usageToken.setCores({
        getETHStatsByAddressAsync: () => {
          return { creditPrice: 100, gasPrice: 20, transactionCount: 54 }
        },
        purchaseCreditsAsync: () => null
      })
      usageToken.setENV({
        AUTO_REFILL_ENABLED: true,
        AUTO_REFILL_AMOUNT: 100,
        NODE_ETH_ADDRESS: '0x99Be343B94f860125bC4fEe278FDCBD38C102D88',
        NODE_ETH_PRIVATE_KEY: '0x308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b02',
        PRIVATE_NETWORK: false
      })
      let updatedTknDefinition = usageToken.tknDefinition
      updatedTknDefinition.networks['1'] = updatedTknDefinition.networks['3']
      usageToken.setTknDefinition(updatedTknDefinition)
    })
    it('should throw error no valid token and purchase failure from Core', async () => {
      let err = null
      try {
        await usageToken.getActiveUsageTokenAsync()
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Unable to get active token : No valid usage token in use : Could not acquire new token')
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    const payloadNew = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 99
    }
    const privateKey = ECDSA.generateKey()
    const newToken = jwt.sign(payloadNew, privateKey.toPEM(), { algorithm: 'ES256' })
    let storedToken = ''
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => null,
        setUsageTokenAsync: val => {
          storedToken = val
        }
      })
      usageToken.setCores({
        getETHStatsByAddressAsync: () => {
          return { creditPrice: 100, gasPrice: 20, transactionCount: 54 }
        },
        purchaseCreditsAsync: () => newToken
      })
      usageToken.setENV({
        AUTO_REFILL_ENABLED: true,
        AUTO_REFILL_AMOUNT: 100,
        NODE_ETH_ADDRESS: '0x99Be343B94f860125bC4fEe278FDCBD38C102D88',
        NODE_ETH_PRIVATE_KEY: '0x308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b02',
        PRIVATE_NETWORK: false
      })
      let updatedTknDefinition = usageToken.tknDefinition
      updatedTknDefinition.networks['1'] = updatedTknDefinition.networks['3']
      usageToken.setTknDefinition(updatedTknDefinition)
    })
    it('should acquire token with no token stored', async () => {
      let activeToken = await usageToken.getActiveUsageTokenAsync()
      expect(activeToken).to.equal(newToken)
      expect(storedToken).to.equal(newToken)
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    const payloadOld = {
      exp: Math.ceil(Date.now() / 1000) - 60 * 60, // 1 hour ago
      bal: 0
    }
    const payloadNew = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 99
    }
    const privateKey = ECDSA.generateKey()
    const oldToken = jwt.sign(payloadOld, privateKey.toPEM(), { algorithm: 'ES256' })
    const newToken = jwt.sign(payloadNew, privateKey.toPEM(), { algorithm: 'ES256' })
    let storedToken = ''
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => oldToken,
        setUsageTokenAsync: val => {
          storedToken = val
        }
      })
      usageToken.setCores({
        getETHStatsByAddressAsync: () => {
          return { creditPrice: 100, gasPrice: 20, transactionCount: 54 }
        },
        purchaseCreditsAsync: () => newToken
      })
      usageToken.setENV({
        AUTO_REFILL_ENABLED: true,
        AUTO_REFILL_AMOUNT: 100,
        NODE_ETH_ADDRESS: '0x99Be343B94f860125bC4fEe278FDCBD38C102D88',
        NODE_ETH_PRIVATE_KEY: '0x308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b02',
        PRIVATE_NETWORK: false
      })
      let updatedTknDefinition = usageToken.tknDefinition
      updatedTknDefinition.networks['1'] = updatedTknDefinition.networks['3']
      usageToken.setTknDefinition(updatedTknDefinition)
    })
    it('should acquire token with 0 balance expired token stored', async () => {
      let activeToken = await usageToken.getActiveUsageTokenAsync()
      expect(activeToken).to.equal(newToken)
      expect(storedToken).to.equal(newToken)
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    before(() => {
      usageToken.setENV({ PRIVATE_NETWORK: false })
    })
    const payloadOld = {
      exp: Math.ceil(Date.now() / 1000) - 60 * 60, // 1 hour ago
      bal: 27
    }
    const privateKey = ECDSA.generateKey()
    const oldToken = jwt.sign(payloadOld, privateKey.toPEM(), { algorithm: 'ES256' })
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => oldToken
      })
      usageToken.setCores({
        refreshUsageTokenAsync: () => null
      })
    })
    it('should throw error on refresh error', async () => {
      let err = null
      try {
        await usageToken.getActiveUsageTokenAsync()
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal(
        'Unable to get active token : No valid usage token in use : Could not refresh existing token'
      )
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    let coreIPs = ['65.1.1.1', '65.1.1.2', '65.1.1.3']
    const payloadOld = {
      exp: Math.ceil(Date.now() / 1000) - 60 * 60, // 1 hour ago
      bal: 27,
      aud: coreIPs.join(',')
    }
    const payloadNew = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 26,
      aud: coreIPs.join(',')
    }
    const privateKey = ECDSA.generateKey()
    const oldToken = jwt.sign(payloadOld, privateKey.toPEM(), { algorithm: 'ES256' })
    const newToken = jwt.sign(payloadNew, privateKey.toPEM(), { algorithm: 'ES256' })
    let storedToken = ''
    before(() => {
      usageToken.setENV({ PRIVATE_NETWORK: false })
      usageToken.setRocksDB({
        getUsageTokenAsync: () => oldToken,
        setUsageTokenAsync: val => {
          storedToken = val
        }
      })
      usageToken.setCores({
        getCoreConnectedIPs: () => coreIPs,
        refreshUsageTokenAsync: () => newToken
      })
    })
    it('should refresh expired token with balance', async () => {
      let activeToken = await usageToken.getActiveUsageTokenAsync()
      expect(activeToken).to.equal(newToken)
      expect(storedToken).to.equal(newToken)
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    let audIPs = ['65.1.1.1', '65.1.1.2', '65.1.1.3']
    let coreIPs = ['65.1.1.2', '65.1.1.3', '65.1.1.1']
    const payloadOld = {
      exp: Math.ceil(Date.now() / 1000) - 60 * 60, // 1 hour ago
      bal: 27,
      aud: audIPs.join(',')
    }
    const payloadNew = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 26,
      aud: audIPs.join(',')
    }
    const privateKey = ECDSA.generateKey()
    const oldToken = jwt.sign(payloadOld, privateKey.toPEM(), { algorithm: 'ES256' })
    const newToken = jwt.sign(payloadNew, privateKey.toPEM(), { algorithm: 'ES256' })
    let storedToken = ''
    before(() => {
      usageToken.setENV({ PRIVATE_NETWORK: false })
      usageToken.setRocksDB({
        getUsageTokenAsync: () => oldToken,
        setUsageTokenAsync: val => {
          storedToken = val
        }
      })
      usageToken.setCores({
        getCoreConnectedIPs: () => coreIPs,
        refreshUsageTokenAsync: () => newToken
      })
    })
    it('should refresh expired token with balance and aud IPs in different order', async () => {
      let activeToken = await usageToken.getActiveUsageTokenAsync()
      expect(activeToken).to.equal(newToken)
      expect(storedToken).to.equal(newToken)
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    let coreIPs = ['65.1.1.1', '65.1.1.2', '65.1.1.3']
    const payloadOld = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 27,
      aud: '65.2.2.2,65.2.2.3,65.2.2.4',
      aulr: 0
    }
    const privateKey = ECDSA.generateKey()
    const oldToken = jwt.sign(payloadOld, privateKey.toPEM(), { algorithm: 'ES256' })
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => oldToken,
        setUsageTokenAsync: () => {}
      })
      usageToken.setENV({ PRIVATE_NETWORK: false })
      usageToken.setCores({
        getCoreConnectedIPs: () => coreIPs
      })
    })
    it('should throw proper error on rate limit exceeded', async () => {
      let errResponse = null
      try {
        await usageToken.getActiveUsageTokenAsync()
      } catch (err) {
        errResponse = err
      }
      expect(errResponse.message).to.equal(
        'Unable to get active token : No valid usage token in use : Could not update token audience : limit exceeded'
      )
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    let coreIPs = ['65.1.1.1', '65.1.1.2', '65.1.1.3']
    const payloadOld = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 27,
      aud: '65.2.2.2,65.2.2.3,65.2.2.4',
      aulr: 1
    }
    const privateKey = ECDSA.generateKey()
    const oldToken = jwt.sign(payloadOld, privateKey.toPEM(), { algorithm: 'ES256' })
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => oldToken,
        setUsageTokenAsync: () => {}
      })
      usageToken.setENV({ PRIVATE_NETWORK: false })
      usageToken.setCores({
        getCoreConnectedIPs: () => coreIPs,
        updateUsageTokenAudienceAsync: () => null
      })
    })
    it('should throw proper error on update error', async () => {
      let errResponse = null
      try {
        await usageToken.getActiveUsageTokenAsync()
      } catch (err) {
        errResponse = err
      }
      expect(errResponse.message).to.equal(
        'Unable to get active token : No valid usage token in use : Could not update token audience'
      )
    })
  })

  describe('getActiveUsageTokenAsync', () => {
    let coreIPs = ['65.1.1.1', '65.1.1.2', '65.1.1.3']
    const payloadOld = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 27,
      aud: '65.2.2.2,65.2.2.3,65.2.2.4',
      aulr: 1
    }
    const payloadNew = {
      exp: Math.ceil(Date.now() / 1000) + 60 * 60, // 1 hour in the future
      bal: 27,
      aud: coreIPs.join(',')
    }
    const privateKey = ECDSA.generateKey()
    const oldToken = jwt.sign(payloadOld, privateKey.toPEM(), { algorithm: 'ES256' })
    const newToken = jwt.sign(payloadNew, privateKey.toPEM(), { algorithm: 'ES256' })
    before(() => {
      usageToken.setRocksDB({
        getUsageTokenAsync: () => oldToken,
        setUsageTokenAsync: () => {}
      })
      usageToken.setENV({ PRIVATE_NETWORK: false })
      usageToken.setCores({
        getCoreConnectedIPs: () => coreIPs,
        updateUsageTokenAudienceAsync: () => newToken
      })
    })
    it('should return token with updated audience', async () => {
      let activeToken = await usageToken.getActiveUsageTokenAsync()
      expect(activeToken).to.equal(newToken)
    })
  })
})
