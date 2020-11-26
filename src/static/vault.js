import axios from 'axios'

function _callVault ({ vault, path, onSuccess, onError, data = {}, method = 'GET' }) {
  axios({
    method,
    url: vault.address + '/v1/' + path,
    headers: {
      'X-VAULT-TOKEN': vault.token
    },
    data
  })
    .then(onSuccess)
    .catch(onError)
}

function listVaultEngines (vault, onSuccess, onError) {
  _callVault({
    vault,
    path: 'sys/mounts',
    onSuccess: (response) => {
      var engines = []
      var excludedEngines = ['cubbyhole/', 'identity/', 'sys/']
      for (const name in response.data.data) {
        if (!excludedEngines.includes(name)) {
          engines.push(name.substring(0, name.length - 1))
        }
      }

      onSuccess(engines)
    },
    onError
  })
}

function getSecret (vault, path, onSuccess, onError) {
  _callVault({
    vault,
    path: vault.engine + '/data' + path,
    onSuccess: (response) => {
      onSuccess(response.data.data)
    },
    onError
  })
}

function login ({ address, username, password, onSuccess, onError }) {
  _callVault({
    vault: {
      address,
      token: ''
    },
    path: 'auth/userpass/login/' + username,
    method: 'POST',
    data: { password },
    onSuccess: (resp) => {
      onSuccess(resp.data.auth.client_token)
    },
    onError
  })
}

function listVaultSecrets (vault, path, onSuccess, onFail) {
  _callVault({
    vault,
    path: vault.engine + '/metadata' + path,
    method: 'LIST',
    onSuccess: (response) => {
      onSuccess(response.data.data.keys)
    },
    onError: onFail
  })
}

function writeOrUpdateSecret (vault, data, onSuccess, onError) {
  _callVault({
    vault,
    path: vault.engine + '/metadata' + data.path,
    method: 'POST',
    data,
    onSuccess,
    onError
  })
}

function deleteSecret (vault, path, onSuccess, onError) {
  _callVault({
    vault,
    path: vault.engine + '/metadata' + path,
    method: 'DELETE',
    onSuccess,
    onError
  })
}

function getSecretsForPath (vault, remainingKeys, secrets, fn, onFinish) {
  listVaultSecrets(vault, remainingKeys[0], (keys) => {
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].charAt(keys[i].length - 1) === '/') {
        remainingKeys.push(remainingKeys[0] + keys[i])
      } else {
        secrets.push(remainingKeys[0] + keys[i])
      }
    }
    remainingKeys.shift()

    if (remainingKeys.length === 0) {
      onFinish(secrets)
    } else {
      fn(remainingKeys, secrets, fn, onFinish)
    }
  }, () => {
    console.log('no data in vault')
    onFinish([])
  })
}

function readVaultSecrets (vault, path, onSuccess, onError) {
  _callVault({
    vault,
    path: vault.engine + '/data' + path,
    onSuccess: (response) => {
      onSuccess(response.data.data)
    },
    onError
  })
}

function getDataRecursive (vault, remainingSecrets, populated, fn, onSuccess) {
  getSecret(vault, remainingSecrets[0], (data) => {
    populated[remainingSecrets[0]] = data
    remainingSecrets.shift()

    if (remainingSecrets.length > 0) {
      fn(vault, remainingSecrets, populated, fn, onSuccess)
    } else {
      onSuccess(populated)
    }
  }, (error) => {
    remainingSecrets.shift()

    if (remainingSecrets.length > 0) {
      fn(vault, remainingSecrets, populated, fn, onSuccess)
    } else {
      onSuccess(populated)
    }
    console.log('Error getting secret ' + remainingSecrets[0] + ': ' + error.message)
  })
}

function getSecretsForKV (vault, onSuccess) {
  getSecretsForPath(vault, ['/'], [], getSecretsForPath, (secrets) => {
    if (secrets.length === 0) {
      onSuccess({})
    } else {
      getDataRecursive(vault, secrets, {}, getDataRecursive, (secretsWithData) => {
        onSuccess(secretsWithData)
      })
    }
  })
}

export default {
  getSecret,
  getSecretsForKV,
  readVaultSecrets,
  writeOrUpdateSecret,
  deleteSecret,
  listVaultEngines,
  login
}
