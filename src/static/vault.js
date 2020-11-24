import axios from 'axios'

var state

function init (appState) {
  state = appState
}

function getSecret (path, onSuccess, onFail) {
  axios.get(state.settings.vault_addr + '/v1/' + state.settings.vault_engine + '/data' + path)
    .then((response) => {
      onSuccess(response.data.data)
    })
    .catch(onFail)
}

function login (username, password, onSuccess, onError) {
  axios.post(state.settings.vault_addr + '/v1/auth/userpass/login/' + username, {
    password
  })
    .then((resp) => {
      onSuccess(resp.data.auth.client_token)
    })
    .catch(onError)
}

// function getSecretMetadata (path, onSuccess, onFail) {
//   axios.get(state.settings.vault_addr + '/v1/' + state.settings.vault_engine + '/metadata' + path)
//     .then((response) => {
//       onSuccess(response.data.data)
//     })
//     .catch(onFail)
// }

function listVaultSecrets (path, onSuccess, onFail) {
  axios({
    method: 'list',
    url: state.settings.vault_addr + '/v1/' + state.settings.vault_engine + '/metadata' + path
  })
    .then((response) => {
      onSuccess(response.data.data.keys)
    })
    .catch(onFail)
}

function writeOrUpdateSecret (item, onSuccess, onFail) {
  axios.post(state.settings.vault_addr + '/v1/' + state.settings.vault_engine + '/data' + item.path, {
    data: item.data
  })
    .then((resp) => {
      onSuccess()
    })
    .catch(onFail)
}

function deleteSecret (path, onSuccess, onFail) {
  axios.delete(state.settings.vault_addr + '/v1/' + state.settings.vault_engine + '/metadata' + path)
    .then(onSuccess)
    .catch(onFail)
}

function getSecretsForPath (remainingKeys, secrets, fn, onFinish) {
  listVaultSecrets(remainingKeys[0], (keys) => {
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

function readVaultSecrets (name, onSuccess, onFail) {
  axios.get(state.settings.vault_addr + '/v1/' + state.settings.vault_engine + '/data/' + name)
    .then((response) => {
      onSuccess(response.data.data)
    })
    .catch(onFail)
}

function getDataRecursive (remainingSecrets, populated, fn, onSuccess) {
  getSecret(remainingSecrets[0], (data) => {
    populated[remainingSecrets[0]] = data
    remainingSecrets.shift()

    if (remainingSecrets.length > 0) {
      fn(remainingSecrets, populated, fn, onSuccess)
    } else {
      onSuccess(populated)
    }
  }, (error) => {
    remainingSecrets.shift()

    if (remainingSecrets.length > 0) {
      fn(remainingSecrets, populated, fn, onSuccess)
    } else {
      onSuccess(populated)
    }
    console.log('Error getting secret ' + remainingSecrets[0] + ': ' + error.message)
  })
}

function getAllSecrets (onSuccess) {
  getSecretsForPath(['/'], [], getSecretsForPath, (secrets) => {
    if (secrets.length === 0) {
      onSuccess({})
    } else {
      getDataRecursive(secrets, {}, getDataRecursive, (secretsWithData) => {
        onSuccess(secretsWithData)
      })
    }
  })
}

export default {
  getSecret,
  getAllSecrets,
  readVaultSecrets,
  writeOrUpdateSecret,
  deleteSecret,
  init,
  login
}
