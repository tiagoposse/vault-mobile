import vaultAPI from 'src/static/vault'
import basics from './basics'
import secretsDB from './secrets'

function sync ({ vault, onSuccess, onError, lastSyncTime }) {
  console.log('SYNC')
  function _updateSyncTime () {
    var lastSync = Date.now()

    basics.update({
      table: 'vaults',
      values: {
        lastSyncTime: lastSync
      },
      whereFields: [{
        field: 'id',
        value: vault.id
      }],
      onSuccess: () => { onSuccess(lastSync) },
      onError
    })
  }

  readSecretsWithValues({
    onError,
    engine: vault.engine.id,
    onSuccess: (localSecrets) => {
      console.log('Return from read')
      console.log(localSecrets)

      vaultAPI.getSecretsForKV(Object.assign({}, vault, { engine: vault.engine.name }), (remoteSecrets) => {
        console.log('return from vault')
        console.log(remoteSecrets)

        var localVaultData = Object.assign({}, vault, { engine: vault.engine.id })
        _recursiveCompareVaultSecretsWithLocal(
          localVaultData,
          remoteSecrets,
          localSecrets,
          () => _recursiveCompareLocalSecretsWithVault(localVaultData, localSecrets, remoteSecrets, _updateSyncTime, onError, lastSyncTime),
          onError,
          lastSyncTime
        )
      })
    }
  })
}

function readSecretsWithValues ({ engine, onSuccess, onError }) {
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
    engine,
    onError,
    includeDestroyed: true,
    onSuccess: (secrets) => _getValuesForItems(secrets, {}, _getValuesForItems)
  })
}

function _recursiveCompareLocalSecretsWithVault (vault, localSecrets, remoteSecrets, onSuccess, onError, lastSyncTime) {
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

    vaultAPI.writeOrUpdateSecret(vault, secrets[0], (resp) => {
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

  _removeSecrets(delIDS, _removeSecrets, () => _addSecrets(addSecrets, _addSecrets, onSuccess))
}

function _recursiveCompareVaultSecretsWithLocal (vault, remoteSecrets, localSecrets, onSuccess, onError, lastSyncTime) {
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
      item.metadata.engine = vault.engine

      // secret does not exist locally, insert
      secretsDB.insertSecret({
        secret: {
          ...item
        },
        onSuccess: () => fn(values, localSecrets, fn),
        onError
      })
    } else {
      // secret exists locally, compare versions and whether it's to destroy remotely
      if (localSecrets[item.path].metadata.destroyed === 1) {
        vaultAPI.deleteSecret(vault, item.path, () => {
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
        vaultAPI.writeOrUpdateSecret(localSecrets[item.path], () => {
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
