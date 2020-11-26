export function setInitSettings (context, settings) {
  context.commit('setInitSettings', settings)
}

export function setVaults (context, vaults) {
  var index = 0
  for (var i = 0; i < vaults.length; i++) {
    if (vaults[i].isDefault) {
      index = i
    }

    vaults[i].syncedThisSession = false
  }

  context.commit('setVaults', vaults)
  context.commit('setActiveVault', index)
}

export function setActiveVault (context, index) {
  context.commit('setActiveVault', index)
}

export function updateSettings (context, data) {
  context.commit('updateSettings', data)
}

export function updateLastSyncTime (context, lastSync) {
  context.commit('updateLastSyncTime', lastSync)
}

export function setBiometricLoginEnabled (context) {
  context.commit('setBiometric', 1)
}

export function setBiometricLoginDisabled (context) {
  context.commit('setBiometric', 0)
}

export function loginWithVault (context, data) {
  context.commit('loginWithVault', data)
}

export function loginWithoutVault (context, data) {
  context.commit('loginWithoutVault', data)
}

export function setReady (context) {
  context.commit('setReady')
}

export function setVaultSynced (context) {
  context.commit('setVaultSynced')
}
