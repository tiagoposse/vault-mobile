import basics from './basics'
import utils from './utils'
import secretsDB from './secrets'

function createUser (username, password, onSuccess) {
  var eKey = utils.generateEncryptionKey(64)
  var salt = utils.generateEncryptionKey(16)

  basics.insert({
    table: 'users',
    values: {
      username,
      password: utils.hash(password + salt),
      salt,
      encryptionKey: utils.encrypt(eKey, password + salt)
    },
    onSuccess: () => {
      setEncryptionKey(eKey)
      onSuccess(eKey)
    }
  })
}

function login (username, password, onSuccess, onError) {
  utils.transactionDecorator(getUser)({
    username,
    onError,
    onSuccess: (user) => {
      if (utils.hash(password + user.salt) === user.password) {
        var eKey = utils.decrypt(user.encryptionKey, password + user.salt)
        setEncryptionKey(eKey)
        onSuccess(user.username, eKey)
      }
    }
  })
}

function getUser ({ username, onSuccess, onError, tx }) {
  tx.executeSql('SELECT * FROM users where username = ?', [username], (tx, res) => {
    if (res.rows.length === 0) {
      onError('User does not exist')
    } else {
      onSuccess(res.rows.item(0))
    }
  })
}

function loginWithFingerprint ({ fingerprintSecret, tx, onSuccess, onError }) {
  tx.executeSql('SELECT * FROM fingerprints', [], (tx, res) => {
    for (var i = 0; i < res.rows.length; i++) {
      var item = res.rows.item(i)
      var encKey = utils.decrypt(item.encryptionKey, fingerprintSecret + item.salt)
      setEncryptionKey(encKey)
      onSuccess(item.username, encKey)
      return
    }
  })
}

function setEncryptionKey (encryptionKey) {
  secretsDB.setEncryptionKey(encryptionKey)
  basics.setEncryptionKey(encryptionKey)
}

function isBiometricLoginEnabled ({ tx, onSuccess, onError }) {
  tx.executeSql('SELECT * FROM users LIMIT 1', [], (tx, res) => {
    if (res.rows.length > 0 && res.rows.item(0).biometricLogin === 1) {
      onSuccess(true)
    } else {
      onSuccess(false)
    }
  })
}

function registerFingerprint (fingerprintSecret, encryptionKey, username, onSuccess, onError) {
  var salt = utils.generateEncryptionKey(16)

  basics.insert({
    table: 'fingerprints',
    values: {
      user: username,
      encryptionKey: utils.encrypt(encryptionKey, fingerprintSecret + salt),
      salt
    },
    onSuccess: () => {
      basics.update({
        table: 'users',
        values: {
          biometricLogin: 1
        },
        whereFields: [],
        onSuccess,
        onError
      })
    },
    onError
  })
}

export default {
  login,
  createUser,
  registerFingerprint,
  loginWithFingerprint: utils.transactionDecorator(loginWithFingerprint),
  isBiometricLoginEnabled: utils.transactionDecorator(isBiometricLoginEnabled)
}
