var CryptoJS = require('crypto-js')

var db

function initUtils (appDB) {
  db = appDB
}

function transactionDecorator (fn) {
  return function () {
    var args = arguments[0]
    var defArgs = {
      onError: () => {}
    }

    if (args !== undefined && !Object.hasOwnProperty.call(args, 'onSuccess')) {
      console.log('OnSuccess callback missing for: ' + fn.name)
      return
    }

    if (args === undefined || !Object.hasOwnProperty.call(args, 'tx')) {
      db.transaction(function (tx) {
        args = Object.assign(defArgs, args, { tx })

        fn.apply(this, [args])
      }, function (error) {
        console.log('Transaction error for ' + fn.name + ': ' + error.message)
      }, function () {
        // var reg = RegExp('^function\\s+([\\w\\$]+)\\(', 'g')
        console.log('Transaction ' + fn.name + ' ok')
      })
    } else {
      args = Object.assign(defArgs, args)
      fn.apply(this, [args])
    }
  }
}

function generateEncryptionKey () {
  return require('csprng')(160, 36)
}

function encrypt (value, passphrase) {
  return CryptoJS.AES.encrypt(value, passphrase).toString()
}

function decrypt (value, passphrase) {
  return CryptoJS.AES.decrypt(value, passphrase).toString(CryptoJS.enc.Utf8)
}

function hash (value) {
  return CryptoJS.SHA512(value).toString()
}

export default {
  transactionDecorator,
  initUtils,
  generateEncryptionKey,
  encrypt,
  decrypt,
  hash
}
