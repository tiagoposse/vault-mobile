export function setInitSettings (state, { vaultAddr, vaultEngine, lastSyncTime }) {
  state.vault_addr = vaultAddr
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

export function setBiometricLoginEnabled (state) {
  state.biometric_login_enabled = true
}
