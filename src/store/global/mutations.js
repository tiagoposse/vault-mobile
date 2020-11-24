export function setAuthToken (state, token) {
  state.auth_token = token
}

export function loginWithVault (state, { username, encryptionKey, token }) {
  state.encryption_key = encryptionKey
  state.auth_token = token
  state.user = username
}

export function loginWithoutVault (state, { username, encryptionKey }) {
  state.encryption_key = encryptionKey
  state.user = username
}
