export function setInitSettings (context, settings) {
  context.commit('setInitSettings', settings)
}

export function updateSettings (context, data) {
  context.commit('updateSettings', data)
}

export function updateLastSyncTime (context, lastSync) {
  context.commit('updateLastSyncTime', lastSync)
}

export function setBiometricLoginEnabled (context) {
  context.commit('setBiometricLoginEnabled')
}
