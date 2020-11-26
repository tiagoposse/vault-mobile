<template>
  <q-page class="flex flex-center">
    <div class="row full-width justify-end">
      <q-select filled v-model="whichVault" :options="vaultList" @input="changeVault" />
    </div>
    <div class="row full-width justify-center" v-if="currentVault !== undefined">
      <template v-if="userPasswordLogin">
        <q-form
          @submit="do_login"
          @reset="reset"
          class="q-gutter-md sm-col-2"
        >
          <q-input
            filled
            v-model="username"
            label="Username"
            lazy-rules
            :rules="[ val => val && val.length > 0 || 'Please type something']"
          />

          <q-input
            filled
            v-model="password"
            label="Password"
            type="password"
            lazy-rules
            :rules="[ val => val && val.length > 0 || 'Please type something']"
          />

          <div>
            <q-btn label="Submit" type="submit" color="primary"/>
            <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
            <q-btn label="Use biometric" color="primary" flat class="q-ml-sm" @click="spawnBiometricLogin" v-if="currentVault.biometricLogin === 1" />
          </div>
        </q-form>

      </template>
      <q-input v-model="password" type="password" label="Password" stack-label v-else />
    </div>
  </q-page>
</template>

<script>
import dbAPI from 'src/static/db/index'
import vault from 'src/static/vault'

export default {
  name: 'PageIndex',
  created () {
    if (this.currentVault !== undefined && this.currentVault.biometricLogin === 1) {
      this.spawnBiometricLogin()
    }
  },
  data () {
    var whichVault
    if (this.$store.state.settings.vaults.length > 0) {
      whichVault = { value: 0, label: this.$store.state.settings.vaults[0].name }

      for (var i = 0; i < this.$store.state.settings.vaults.length; i++) {
        if (this.$store.state.settings.vaults[i].isDefault) {
          whichVault = { value: i, label: this.$store.state.settings.vaults[i].name }
          break
        }
      }
    } else {
      whichVault = { value: -1, label: '' }
    }

    return {
      username: '',
      password: '',
      whichVault,
      userPasswordLogin: true
    }
  },
  computed: {
    currentVault () {
      return this.$store.getters['settings/getCurrentVault']
    },
    vaultList () {
      var options = []
      for (var i = 0; i < this.$store.state.settings.vaults.length; i++) {
        options.push({
          label: this.$store.state.settings.vaults[i].name,
          value: i
        })
      }

      return options
    }
  },
  methods: {
    changeVault (value) {
      this.$store.dispatch('settings/setActiveVault', value)
    },
    do_login () {
      var loginVault = this.currentVault

      dbAPI.localLogin({
        address: loginVault.address,
        vaultId: loginVault.id,
        username: this.username,
        password: this.password,
        onSuccess: (encryptionKey) => {
          var callback = (token = '') => this.loginSuccess(encryptionKey, token)
          vault.login({
            username: this.username,
            address: loginVault.address,
            password: this.password,
            onSuccess: callback,
            onError: callback
          })
        },
        onError: this.loginFail
      })
    },
    reset () {
      this.username = ''
      this.password = ''
    },
    loginSuccess (encryptionKey, token = '') {
      dbAPI.listVaultEngines({
        vaultId: this.currentVault.id,
        onSuccess: (engines) => {
          if (token !== '') {
            this.$store.dispatch('settings/loginWithVault', { username: this.username, encryptionKey, token, engines: engines })
          } else {
            this.$store.dispatch('settings/loginWithoutVault', { username: this.username, encryptionKey, engines: engines })
          }

          var engine = 0
          for (var i = 0; i < engines.length; i++) {
            if (engines[i].isDefault) {
              engine = engines[i].id
              break
            }
          }

          var vault = this.$store.getters['settings/getCurrentVault']
          this.$router.push('/' + vault.id + '/' + engine + '/secrets').catch((err) => console.log('Error going from login to /secrets: ' + err))
        },
        onError: () => console.log('error retrieving vault engines')
      })
    },
    loginFail () {
      this.$q.notify({
        color: 'negative',
        position: 'top',
        message: 'Login unsuccessful',
        icon: 'report_problem'
      })
    },
    createUser (onSuccess) {
      dbAPI.createUser(this.username, this.password, (encryptionKey) => {})
    },
    spawnBiometricLogin () {
      window.Fingerprint.loadBiometricSecret({
        title: 'Vault mobile',
        description: 'Unlock app',
        disableBackup: true // always disabled on Android
      }, (data) => {
        dbAPI.loginWithFingerprint({
          vaultId: this.currentVault.id,
          fingerprintSecret: data,
          onSuccess: (password, encryptionKey) => {
            vault.login({
              username: this.currentVault.username,
              address: this.currentVault.address,
              password: password,
              onSuccess: (token) => {
                this.loginSuccess(encryptionKey, token)
              },
              onError: () => {
                this.loginSuccess(encryptionKey)
              }
            })
          }
        })
      }, (err) => {
        console.log('error register', err)
      })
    }
  }
}
</script>
