import basics from './basics'
import utils from './utils'

var encryptionKey = ''

function setEncryptionKey (key) {
  encryptionKey = key
}

function getSecretValues ({ secretId, onSuccess, onError, tx }) {
  tx.executeSql('SELECT * FROM secret_values WHERE secret_id = ?', [secretId], function (tx, rs) {
    var rows = {}
    for (var i = 0; i < rs.rows.length; i++) {
      var key = rs.rows.item(i).field_name
      var value = utils.decrypt(rs.rows.item(i).value, encryptionKey)
      rows[key] = value
    }
    onSuccess(rows)
  }, function (tx, error) {
    console.log('getSecretValues error: ' + error.message)
    onError()
  })
}

function listSecrets ({ tx, onSuccess, onError, includeDestroyed = false }) {
  tx.executeSql('SELECT * FROM secrets', [], function (tx, rs) {
    var rows = {}

    for (var i = 0; i < rs.rows.length; i++) {
      var item = rs.rows.item(i)
      var destroyed = parseInt(utils.decrypt(item.destroyed, encryptionKey))
      var path = utils.decrypt(item.path, encryptionKey)

      if (includeDestroyed || destroyed === 0) {
        rows[path] = {
          id: item.id,
          path,
          metadata: {
            version: parseInt(utils.decrypt(item.version, encryptionKey)),
            lastUpdated: Number(utils.decrypt(item.lastUpdated, encryptionKey)),
            destroyed: destroyed,
            createdTime: Number(utils.decrypt(item.createdTime, encryptionKey))
          }
        }
      }
    }

    onSuccess(rows)
  }, function (tx, error) {
    console.log('List secrets error: ' + error.message)
    onError()
  })
}

function insertSecret ({ secret, onSuccess, onError }) {
  var baseSecret = {
    version: 1,
    destroyed: 0,
    createdTime: Date.now(),
    lastUpdated: Date.now()
  }

  basics.insert({
    table: 'secrets',
    values: Object.assign(baseSecret, { path: secret.path, ...secret.metadata }),
    onError,
    onSuccess: (secretId) => {
      updateSecretValues({
        secretId,
        newData: secret.data,
        oldData: {},
        onSuccess,
        onError
      })
    }
  })
}

function updateSecretValues ({ secretId, newData, oldData, onSuccess, onError }) {
  function _processDataField (items, toCompare, fn, onFinish, insertOrDelete = 'insert') {
    if (items.length === 0) {
      onFinish()
      return
    }

    var data = items[0]
    items.shift()
    var retFN = () => fn(items, toCompare, fn, onFinish, insertOrDelete)

    if (!Object.prototype.hasOwnProperty.call(toCompare, data.field)) {
      // value is new, update
      basics.insert({
        table: 'secret_values',
        values: {
          secret_id: secretId,
          field_name: data.field,
          value: data.value
        },
        onSuccess: retFN,
        onError
      })
    } else if (data.value !== toCompare[data.field]) {
      // values are different, update local

      console.log('values are different: ' + data.value + ' to: ' + toCompare[data.field])
      basics.update({
        table: 'secret_values',
        values: {
          value: data.value
        },
        whereFields: [
          { field: 'secret_id', value: secretId },
          { field: 'field_name', value: data.field }
        ],
        onSuccess: retFN,
        onError
      })
    } else {
      // field is the same, do nothing
      retFN()
    }
  }

  function _processDeleteFields (items, toCompare, fn, onFinish) {
    if (items.length === 0) {
      onFinish()
      return
    }
    var item = items[0]
    items.shift()

    if (!Object.hasOwnProperty.call(toCompare, item)) {
      basics.deleteFromTable({
        table: 'secret_values',
        onSuccess: () => fn(items, toCompare, fn, onFinish),
        onError,
        overrideWhereStr: 'secret_id = ? AND field_name = ?',
        overrideWhereValues: [secretId, item]
      })
    } else {
      fn(items, toCompare, fn, onFinish)
    }
  }

  var oldKeys = []
  var newValues = []
  for (const field in newData) {
    newValues.push({ field, value: newData[field] })
  }

  for (const field in oldData) {
    oldKeys.push(field)
  }

  _processDataField(
    newValues,
    oldData,
    _processDataField,
    () => _processDeleteFields(oldKeys, newData, _processDeleteFields, onSuccess)
  )
}

function updateSecret ({ secretId, newItem, oldItem, onSuccess, onError, updateMetadata = true, lastSyncTime }) {
  var callback = () => {
    console.log('metadata updated.')
    updateSecretValues({
      secretId,
      newData: newItem.data,
      oldData: oldItem.data,
      onSuccess: () => {
        onSuccess(newItem)
      },
      onError
    })
  }

  if (updateMetadata) {
    if (oldItem.metadata.lastUpdated <= lastSyncTime) {
      newItem.metadata.version = parseInt(newItem.metadata.version) + 1
    }

    newItem.metadata.lastUpdated = Date.now()
    basics.update({
      table: 'secrets',
      values: newItem.metadata,
      whereFields: [{ field: 'id', value: secretId }],
      onSuccess: callback,
      onError
    })
  } else {
    callback()
  }
}

function listDeletedSecrets ({ onSuccess, tx }) {
  tx.executeSql('SELECT * FROM secrets where destroyed == ?', [1], function (tx, rs) {
    var rows = []
    for (var i = 0; i < rs.rows.length; i++) {
      var item = rs.rows.item(i)
      rows.push({
        path: item.path,
        metadata: {
          version: item.version,
          lastUpdated: item.lastUpdated
        }
      })
    }

    onSuccess(rows)
  })
}

function deleteSecret ({ secretId, onSuccess, onError }) {
  basics.update({
    table: 'secrets',
    values: { destroyed: 1 },
    whereFields: [{ field: 'id', value: secretId }],
    onSuccess: () => {
      basics.deleteFromTable({
        table: 'secret_values',
        whereFields: [{ field: 'secret_id', value: secretId }],
        onSuccess,
        onError
      })
    },
    onError
  })
}

function fullyDeleteSecret ({ secretId, onSuccess, onError }) {
  basics.deleteFromTable({
    table: 'secrets',
    whereFields: [{ field: 'id', value: secretId }],
    onSuccess,
    onError
  })
}

export default {
  setEncryptionKey,
  listSecrets: utils.transactionDecorator(listSecrets),
  listDeletedSecrets: utils.transactionDecorator(listDeletedSecrets),
  getSecretValues: utils.transactionDecorator(getSecretValues),
  insertSecret,
  updateSecret,
  deleteSecret,
  fullyDeleteSecret
}
