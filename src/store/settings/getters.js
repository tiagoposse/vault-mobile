export function isInitialized (state) {
  return state.vault_addr !== ''
}

export function getCurrentVault (state) {
  return state.vaults[state.currentVault]
}

export function getCurrentAddress (state) {
  return state.vaults[state.currentVault].vault_addr
}

export function getCurrentVaultId (state) {
  return state.vaults[state.currentVault].id
}

export function getCurrentEngine (state) {
  return state.vaults[state.currentVault].engines[state.currentEngine]
}

export function getVaultEngines (state) {
  return state.vaults[state.currentVault].engines
}
