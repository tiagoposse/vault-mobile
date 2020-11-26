<template>
  <q-page>
    <q-expansion-item default-opened label="General Settings">
      <q-form @submit="saveGeneralChanges" class="col sm-col-4 q-gutter-xs">
        <q-input v-model="vault_addr" label="Vault address" stack-label />
        <q-input v-model="username" label="Vault username" stack-label />
        <q-input v-model="sync_period" type="number" label="Period of sync" stack-label />
        <q-btn v-if="hasGeneralChanges" label="Save Changes" @click="saveGeneralChanges" />
      </q-form>
    </q-expansion-item>
    <q-expansion-item default-opened label="Security">
        <q-input type="password" filled label="Password" />
        <q-btn label="Change password" @click="changePassword" v-if="password !== ''" />
        <div>Biometric login is: {{ biometricEnabled === 1 }}</div>
        <q-btn v-if="!biometricEnabled" label="Enable biometric login" @click="registerBiometricLogin" />
        <q-btn v-else label="Disable biometric login" @click="disableBiometricLogin" />
        <q-btn label="Rekey vault" @click="rekey" />
    </q-expansion-item>
  </q-page>
</template>

<script>
import dbAPI from 'src/static/db/index'

export default {
  name: 'PageIndex',
  data () {
    var currentVault = this.$store.getters['settings/getCurrentVault']

    return {
      currentVault,
      vault_addr: currentVault.address,
      username: currentVault.username,
      password: '',
      sync_period: currentVault.sync_period,
      biometricEnabled: currentVault.biometricLogin
    }
  },
  computed: {
    hasGeneralChanges () {
      return this.vault_addr !== this.currentVault.address ||
        this.sync_period !== this.currentVault.syncPeriod
    }
  },
  methods: {
    changePassword () {
      return this.vault_addr !== this.currentVault.address ||
        this.sync_period !== this.currentVault.syncPeriod
    },
    rekey () {
      this.$q.dialog({
        title: 'Confirm Vault rekey operation',
        message: 'Are you sure you want to rekey vault ' + this.currentVault.name + '? This operation cannot be undone.',
        cancel: true,
        persistent: true
      }).onOk(() => {
        dbAPI.rekeyVault({
          vault: this.currentVault.id,
          onSuccess: () => {
            this.$q.notify({
              color: 'positive',
              position: 'top',
              message: 'Vault ' + this.currentVault.name + ' rekeyed successfully. ',
              icon: 'success'
            })
          },
          onError: (err) => { console.log('Error rekeying vault: ' + this.currentVault.name + ': ', err) }
        })
      })
    },
    saveGeneralChanges () {
      var body = {}
      if (this.vault_addr !== this.currentVault.address) {
        body.vaultAddr = this.vault_addr
      }
      if (this.sync_period !== this.currentVault.syncPeriod) {
        body.syncPeriod = this.sync_period
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
    disableBiometricLogin () {
      dbAPI.disableBiometricLogin(this.currentVault.id, () => {
        this.$q.notify({
          color: 'positive',
          position: 'top',
          message: 'Biometric login disabled',
          icon: 'check'
        })
        this.$store.dispatch('settings/setBiometricDisabled')
      }, () => {
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: 'Error disabling biometrics',
          icon: 'check'
        })
      })
    },
    registerBiometricLogin () {
      var fingerprintSecret = dbAPI.generateEncryptionKey()

      this.$q.dialog({
        title: 'Password required',
        message: 'Please insert your password',
        prompt: { model: '' },
        cancel: true,
        persistent: true
      }).onOk(data => {
        window.Fingerprint.registerBiometricSecret({
          title: 'Vault mobile',
          description: 'Register your finger',
          secret: fingerprintSecret,
          invalidateOnEnrollment: true,
          disableBackup: true // always disabled on Android
        }, () => {
          dbAPI.registerFingerprint({
            vaultId: this.currentVault.id,
            fingerprintSecret,
            password: data,
            encryptionKey: this.currentVault.encryptionKey,
            onSuccess: () => {
              this.$store.dispatch('settings/setBiometricLoginEnabled')
              this.biometricEnabled = 1
            },
            onError: (err) => {
              this.$q.notify({
                color: 'negative',
                position: 'top',
                message: 'Error registering fingerprint',
                icon: 'report_problem'
              })

              console.log(err)
            }
          })
        }, (err) => {
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: 'Error registering fingerprint',
            icon: 'report_problem'
          })
          console.log('error register', err)
        })
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
  }
}
</script>
