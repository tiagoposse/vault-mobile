import vault from 'src/static/vault'
import basics from './basics'
import secretsDB from './secrets'

function sync ({ onSuccess, onError, lastSyncTime }) {
  console.log('SYNC')
  function _updateSyncTime () {
    var lastSync = Date.now()

    basics.update({
      table: 'settings',
      values: {
        lastSyncTime: lastSync
      },
      onSuccess: () => { onSuccess(lastSync) },
      onError
    })
  }

  readSecretsWithValues({
    onError,
    onSuccess: (localSecrets) => {
      console.log('Return from read')
      console.log(localSecrets)

      vault.getAllSecrets((remoteSecrets) => {
        console.log('return from vault')
        console.log(remoteSecrets)

        _recursiveCompareVaultSecretsWithLocal(
          remoteSecrets,
          localSecrets,
          () => _recursiveCompareLocalSecretsWithVault(localSecrets, remoteSecrets, _updateSyncTime, onError, lastSyncTime),
          onError,
          lastSyncTime
        )
      })
    }
  })
}

function readSecretsWithValues ({ onSuccess, onError }) {
  function _getValuesForItems (toProcess, processed, fn) {
    var keys = Object.keys(toProcess)
    if (keys.length === 0) {
      onSuccess(processed)
      return
    }

    var path = keys[0]

    secretsDB.getSecretValues({
      secretId: toProcess[path].id,
      onSuccess: (data) => {
        keys.shift()
        processed[path] = Object.assign({}, toProcess[path], { data })
        delete toProcess[path]

        _getValuesForItems(toProcess, processed, fn)
      },
      onError
    })
  }

  secretsDB.listSecrets({
    onError,
    includeDestroyed: true,
    onSuccess: (secrets) => {
      _getValuesForItems(secrets, {}, _getValuesForItems)
    }
  })
}

function _recursiveCompareLocalSecretsWithVault (localSecrets, remoteSecrets, onSuccess, onError, lastSyncTime) {
  function _removeSecrets (ids, fn, onSuccess) {
    if (ids.length === 0) {
      onSuccess()
      return
    }

    var secretId = ids[0]
    ids.shift()

    secretsDB.fullyDeleteSecret({
      secretId,
      onSuccess: () => fn(ids, fn, onSuccess),
      onError
    })
  }

  function _addSecrets (secrets, fn, onSuccess) {
    if (secrets.length === 0) {
      onSuccess()
      return
    }

    vault.writeOrUpdateSecret(secrets[0], (resp) => {
      secrets.shift()
      if (secrets.length > 0) {
        fn(secrets, fn, onSuccess)
      } else {
        onSuccess()
      }
    }, () => {
      console.log('ERROR ON WRITEORUPDATE')
    })
  }

  var delIDS = []
  var addSecrets = []
  for (const path in localSecrets) {
    if (!Object.hasOwnProperty.call(remoteSecrets, path)) {
      if (localSecrets[path].metadata.createdTime > lastSyncTime) {
        addSecrets.push(localSecrets[path])
      } else {
        delIDS.push(localSecrets[path].id)
      }
    }
  }

  console.log('add:')
  console.log(addSecrets.slice())

  _removeSecrets(delIDS, _removeSecrets, () => _addSecrets(addSecrets, _addSecrets, onSuccess))
}

function _recursiveCompareVaultSecretsWithLocal (remoteSecrets, localSecrets, onSuccess, onError, lastSyncTime) {
  var values = []
  for (const path in remoteSecrets) {
    values.push({
      path,
      data: remoteSecrets[path].data,
      metadata: {
        lastUpdated: Date.parse(remoteSecrets[path].metadata.created_time),
        createdTime: Date.parse(remoteSecrets[path].metadata.created_time),
        version: remoteSecrets[path].metadata.version
      }
    })
  }

  var _compareRecursively = (values, localSecrets, fn) => {
    if (values.length === 0) {
      onSuccess()
      return
    }

    var item = values[0]
    values.shift()

    if (!Object.prototype.hasOwnProperty.call(localSecrets, item.path)) {
      // console.log('insert:')
      // console.log(item.path)
      // secret does not exist locally, insert
      secretsDB.insertSecret({
        secret: {
          path: item.path,
          ...item
        },
        onSuccess: () => fn(values, localSecrets, fn),
        onError
      })
    } else {
      // secret exists locally, compare versions and whether it's to destroy remotely
      if (localSecrets[item.path].metadata.destroyed === 1) {
        vault.deleteSecret(item.path, (resp) => {
          fn(values, localSecrets, fn)
        }, () => {
          console.log('ERROR ON DELETESECRET')
        })
      } else if (item.metadata.version > localSecrets[item.path].metadata.version) {
        secretsDB.updateSecret({
          secretId: item.id,
          newItem: item,
          oldItem: localSecrets[item.path],
          onSuccess: () => fn(values, localSecrets, fn),
          onError,
          lastSyncTime
        })
      } else if (item.metadata.version < localSecrets[item.path].metadata.version) {
        vault.writeOrUpdateSecret(localSecrets[item.path], (resp) => {
          fn(values, localSecrets, fn)
        }, () => {
          console.log('ERROR ON WRITEORUPDATE')
        })
      } else {
        fn(values, localSecrets, fn)
      }
    }
  }

  _compareRecursively(values, localSecrets, _compareRecursively)
}

export default {
  sync
}
