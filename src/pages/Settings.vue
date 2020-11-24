<template>
  <q-page>
    <div class="row full-width q-gutter-md">
      <q-form @submit="saveChanges" class="col col-4 q-gutter-md">
        <q-input v-model="vault_addr" label="Vault address" stack-label />
        <q-input v-model="vault_engine" label="Secret Engine" stack-label />
        <q-input v-model="sync_period" label="Period of sync" stack-label />
        <q-input v-model="biometricEnabled" :label="'Biometric login is: ' + biometricEnabled" stack-label readonly />
        <q-btn v-if="!biometricEnabled" label="Enable biometric login" @click="registerBiometricLogin" />
        <q-btn v-if="hasChanges" label="Save Changes" @click="saveChanges" />
      </q-form>
    </div>
  </q-page>
</template>

<script>
import dbAPI from 'src/static/db/index'

export default {
  name: 'PageIndex',
  data () {
    return {
      vault_addr: this.$store.state.settings.vault_addr,
      vault_engine: this.$store.state.settings.vault_engine,
      sync_period: this.$store.state.settings.sync_period,
      biometricEnabled: this.$store.state.settings.biometric_login_enabled
    }
  },
  computed: {
    hasChanges () {
      return this.vault_addr !== this.$store.state.settings.vault_addr ||
        this.vault_engine !== this.$store.state.settings.vault_engine ||
        this.sync_period !== this.$store.state.settings.sync_period
    }
  },
  methods: {
    saveChanges () {
      var body = {}
      if (this.vault_addr !== this.$store.state.settings.vault_addr) {
        body.vault_addr = this.vault_addr
      }
      if (this.vault_engine !== this.$store.state.settings.vault_engine) {
        body.vault_engine = this.vault_engine
      }
      if (this.sync_period !== this.$store.state.settings.sync_period) {
        body.sync_period = this.sync_period
      }

      if (Object.keys(body).length > 0) {
        dbAPI.update({
          table: 'settings',
          values: body,
          onSuccess: () => {
            this.$store.dispatch('settings/updateSettings', body)
            this.$q.notify({
              color: 'positive',
              position: 'top',
              message: 'Changes saved successfully.',
              icon: 'check'
            })
          }
        })
      }
    },
    registerBiometricLogin () {
      var fingerprintEncryptionKey = dbAPI.generateEncryptionKey()
      console.log(fingerprintEncryptionKey)
      window.Fingerprint.registerBiometricSecret({
        title: 'Vault mobile',
        description: 'Register your finger',
        secret: fingerprintEncryptionKey,
        invalidateOnEnrollment: true,
        disableBackup: true // always disabled on Android
      }, (data) => {
        dbAPI.registerFingerprint(
          fingerprintEncryptionKey,
          this.$store.state.global.encryption_key,
          this.$store.state.global.user,
          () => {
            this.$store.dispatch('settings/setBiometricLoginEnabled')
            this.biometricEnabled = true
          },
          () => {}
        )
      }, (err) => {
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: 'Error registering fingerprint',
          icon: 'report_problem'
        })
        console.log('error register', err)
      })
    }
  }
}
</script>
