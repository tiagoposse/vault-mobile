export function setAuthToken (context, token) {
  context.commit('setAuthToken', token)
}

export function loginWithVault (context, data) {
  context.commit('loginWithVault', data)
}

export function loginWithoutVault (context, data) {
  context.commit('loginWithoutVault', data)
}
