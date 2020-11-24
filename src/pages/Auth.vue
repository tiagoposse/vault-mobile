<template>
  <q-page class="flex flex-center">
    <div class="row full-width justify-center">
      <template v-if="userPasswordLogin">
        <q-form
          @submit="do_login"
          @reset="reset"
          class="q-gutter-md col-2"
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
            <q-btn label="Use biometric" color="primary" flat class="q-ml-sm" @click="spawnBiometricLogin" v-if="$store.state.settings.biometric_login_enabled" />
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
  data () {
    return {
      username: '',
      password: '',
      userPasswordLogin: true
    }
  },
  updated () {
    if (this.$store.state.settings.biometric_login_enabled) {
      console.log('spawning')
      this.spawnBiometricLogin()
    }
  },
  mounted () {
    dbAPI.isBiometricLoginEnabled({
      onSuccess: (result) => {
        if (result) {
          this.$store.dispatch('settings/setBiometricLoginEnabled')
        }
      },
      onError: () => {
        console.log('error retrieving biometric options')
      }
    })
  },
  methods: {
    do_login () {
      dbAPI.login(this.username, this.password,
        (encryptionKey) => {
          var callback = (token = '') => this.loginSuccess(encryptionKey, token)
          vault.login(this.username, this.password, callback, callback)
        },
        () => {
          vault.login(this.username, this.password,
            (token) => {
              dbAPI.createUser(
                this.username,
                this.password,
                (username, encryptionKey) => this.loginSuccess(username, encryptionKey, token)
              )
            },
            this.loginFail
          )
        }
      )
    },
    reset () {
      this.username = ''
      this.password = ''
    },
    loginSuccess (username, encryptionKey, token = '') {
      if (token !== '') {
        this.$axios.defaults.headers.common['X-VAULT-TOKEN'] = token
        this.$store.dispatch('global/loginWithVault', { username, encryptionKey, token })
      } else {
        this.$store.dispatch('global/loginWithoutVault', { username, encryptionKey })
      }

      this.$router.push('/secrets').catch((err) => console.log('Error going from login to /: ' + err))
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
          fingerprintSecret: data,
          onSuccess: (username, encryptionKey) => {
            this.loginSuccess(username, encryptionKey)
          }
        })
      }, (err) => {
        console.log('error register', err)
      })
    }
  }
}
</script>
