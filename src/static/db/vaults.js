import vault from '../vault'
import basics from './basics'
import utils from './utils'
import secretsDB from './secrets'

function listConfiguredVaults ({ tx, onSuccess, onError }) {
  tx.executeSql('SELECT * FROM vaults', [], function (tx, rs) {
    var vaults = []
    for (var i = 0; i < rs.rows.length; i++) {
      var value = rs.rows.item(i)
      delete value.encryptionKey
      delete value.salt
      delete value.password

      value.engines = []

      vaults.push(value)
    }

    onSuccess(vaults)
  }, function (tx, error) {
    console.log('readSettings error: ' + error.message)
  })
}

function listVaultEngines ({ tx, vaultId, onSuccess, onError }) {
  tx.executeSql('SELECT * FROM engines where vault = ?', [vaultId], (tx, rs) => {
    if (rs.rows.length === 0) {
      onError('Vault does not exist')
    } else {
      var engines = []
      for (var i = 0; i < rs.rows.length; i++) {
        engines.push(rs.rows.item(i))
      }

      onSuccess(engines)
    }
  })
}

function createEngine ({ vaultId, name, onSuccess, onError, makeDefault = false }) {
  basics.insert({
    table: 'engines',
    values: {
      vault: vaultId,
      name,
      isDefault: makeDefault ? 1 : 0
    },
    onSuccess,
    onError
  })
}

function configureVault ({ name, address, username, password, onSuccess, onError, importEngines = false, makeDefault = false }) {
  function _recursiveCreateEngines (vaultId, engines, insertedEngines, fn, isDefault, onFinish) {
    if (engines.length === 0) {
      onFinish(insertedEngines)
    } else {
      var engine = engines[0]
      engines.shift()

      createEngine({
        vaultId,
        name: engine,
        onSuccess: (id) => {
          insertedEngines.push({
            vault: vaultId,
            id,
            name: engine,
            isDefault: isDefault ? 1 : 0
          })
          fn(vaultId, engines, insertedEngines, fn, false, onFinish)
        },
        makeDefault: isDefault,
        onError
      })
    }
  }

  var eKey = utils.generateEncryptionKey(64)
  var salt = utils.generateEncryptionKey(16)

  vault.login({
    address,
    username,
    password,
    onSuccess: (token) => {
      basics.insert({
        table: 'vaults',
        values: {
          name,
          address,
          username,
          password: utils.hash(password + salt),
          salt,
          encryptionKey: utils.encrypt(eKey, password + salt),
          isDefault: makeDefault ? 1 : 0
        },
        onSuccess: (vaultId) => {
          if (importEngines) {
            vault.listVaultEngines({ address, token }, (engines) => {
              _recursiveCreateEngines(vaultId, engines, [], _recursiveCreateEngines, true, (insertedEngines) => {
                setEncryptionKey(eKey)
                onSuccess({
                  id: vaultId,
                  encryptionKey: eKey,
                  address,
                  name,
                  engines: insertedEngines,
                  auth_token: token
                })
              })
            })
          } else {
            setEncryptionKey(eKey)
            onSuccess({
              id: vaultId,
              encryptionKey: eKey,
              address,
              name,
              engines: [],
              auth_token: token
            })
          }
        },
        onError
      })
    },
    onError
  })
}

function localLogin ({ tx, vaultId, username, password, onSuccess, onError }) {
  tx.executeSql('SELECT * FROM vaults where username = ? and id = ?', [username, vaultId], (tx, res) => {
    if (res.rows.length === 0) {
      onError('User does not exist')
    } else {
      var item = res.rows.item(0)
      if (utils.hash(password + item.salt) === item.password) {
        var eKey = utils.decrypt(item.encryptionKey, password + item.salt)
        setEncryptionKey(eKey)
        onSuccess(eKey)
      }
    }
  })
}

function importEngines (vaultId, address, onSuccess, onError) {
  function _recursiveCreateEngines (engines, fn, onFinish) {
    if (engines.length === 0) {
      onFinish()
    } else {
      var engine = engines[0]
      engines.shift()

      createEngine({
        vaultId,
        name: engine,
        onSuccess: () => {
          fn(engines, fn, onFinish)
        },
        onError
      })
    }
  }

  vault.listVaultEngines(address, (engines) => {
    _recursiveCreateEngines(engines, _recursiveCreateEngines, onSuccess)
  }, onError)
}

function setEncryptionKey (encryptionKey) {
  secretsDB.setEncryptionKey(encryptionKey)
  basics.setEncryptionKey(encryptionKey)
}

function loginWithFingerprint ({ fingerprintSecret, tx, onSuccess, onError }) {
  tx.executeSql('SELECT * FROM fingerprints', [], (tx, res) => {
    for (var i = 0; i < res.rows.length; i++) {
      var item = res.rows.item(i)
      var encKey = utils.decrypt(item.encryptionKey, fingerprintSecret)
      var password = utils.decrypt(item.vaultPassword, fingerprintSecret)
      setEncryptionKey(encKey)

      onSuccess(password, encKey)
      return
    }
  })
}

function isBiometricLoginEnabled ({ tx, vaultId, onSuccess, onError }) {
  tx.executeSql('SELECT * FROM vaults where id = ?', [vaultId], (tx, res) => {
    if (res.rows.length > 0 && res.rows.item(0).biometricLogin === 1) {
      onSuccess(true)
    } else {
      onSuccess(false)
    }
  })
}

function registerFingerprint ({ tx, vaultId, fingerprintSecret, password, encryptionKey, onSuccess, onError }) {
  tx.executeSql('SELECT salt, password FROM vaults where id = ?', [vaultId], (tx, res) => {
    if (utils.hash(password + res.rows.item(0).salt) === res.rows.item(0).password) {
      basics.insert({
        table: 'fingerprints',
        values: {
          vault: vaultId,
          encryptionKey: utils.encrypt(encryptionKey, fingerprintSecret),
          vaultPassword: utils.encrypt(password, fingerprintSecret)
        },
        onSuccess: () => {
          basics.update({
            table: 'vaults',
            values: {
              biometricLogin: 1
            },
            whereFields: [{
              field: 'id',
              value: vaultId
            }],
            onSuccess,
            onError
          })
        },
        onError
      })
    } else {
      onError('Passwords don\'t match')
    }
  }, (err) => { console.log(err) })
}

function disableBiometricLogin (vaultId, onSuccess, onError) {
  basics.deleteFromTable({
    table: 'fingerprints',
    whereFields: [{
      field: 'vault',
      value: vaultId
    }],
    onSuccess: () => {
      basics.update({
        table: 'vaults',
        values: {
          biometricLogin: 0
        },
        whereFields: [{
          field: 'id',
          value: vaultId
        }],
        onSuccess,
        onError
      })
    },
    onError
  })
}

export default {
  listConfiguredVaults: utils.transactionDecorator(listConfiguredVaults),
  listVaultEngines: utils.transactionDecorator(listVaultEngines),
  configureVault,
  importEngines,
  localLogin: utils.transactionDecorator(localLogin),
  disableBiometricLogin,
  registerFingerprint: utils.transactionDecorator(registerFingerprint),
  loginWithFingerprint: utils.transactionDecorator(loginWithFingerprint),
  isBiometricLoginEnabled: utils.transactionDecorator(isBiometricLoginEnabled)
}
