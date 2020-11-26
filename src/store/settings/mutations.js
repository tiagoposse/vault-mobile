export function setVaults (state, vaults) {
  state.vaults = vaults
}

export function setActiveVault (state, index) {
  state.currentVault = index
}

export function setActiveEngine (state, index) {
  state.currentEngine = index
}

export function setInitSettings (state, { address, vaultEngine, lastSyncTime }) {
  state.vault_addr = address
  state.vault_engine = vaultEngine
  state.last_sync_time = lastSyncTime
  state.ready = true
}

export function updateSettings (state, data) {
  if (Object.hasOwnProperty.call(data, 'vault_addr')) {
    state.vault_addr = data.vault_addr
  }

  if (Object.hasOwnProperty.call(data, 'vault_engine')) {
    state.vault_engine = data.vault_engine
  }

  if (Object.hasOwnProperty.call(data, 'last_sync_time')) {
    state.last_sync_time = data.last_sync_time
  }
}

export function updateLastSyncTime (state, syncTime) {
  state.last_sync_time = syncTime
}

export function setBiometric (state, value) {
  state.vaults[state.currentVault].biometricLogin = value
}

export function loginWithVault (state, { encryptionKey, token, engines }) {
  state.vaults[state.currentVault].encryptionKey = encryptionKey
  state.vaults[state.currentVault].auth_token = token
  state.vaults[state.currentVault].engines = engines

  var defaultEngine = 0
  for (var i = 0; i < engines.length; i++) {
    if (engines[i].isDefault) {
      defaultEngine = i
      break
    }
  }

  state.currentEngine = defaultEngine
  state.loggedIn = true
}

export function loginWithoutVault (state, { encryptionKey, engines }) {
  state.vaults[state.currentVault].encryptionKey = encryptionKey
  state.vaults[state.currentVault].engines = engines

  var defaultEngine = 0
  for (var i = 0; i < engines.length; i++) {
    if (engines[i].isDefault) {
      defaultEngine = i
      break
    }
  }

  state.currentEngine = defaultEngine
  state.loggedIn = true
}

export function setReady (state) {
  state.ready = true
}

export function setVaultSynced (state) {
  state.vaults[state.currentVault].syncedThisSession = true
}
