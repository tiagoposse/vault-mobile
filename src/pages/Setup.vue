<template>
  <q-page class="flex flex-center">
    <div class="row full-width justify-center">
      <q-form
        @submit="do_setup"
        @reset="reset"
        class="q-gutter-md sm-col-2"
      >
        <q-input
          filled
          v-model="name"
          label="Name"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please type something']"
        />

        <q-input
          filled
          v-model="vaultAddr"
          label="Vault Address"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please type something']"
        />

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
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script>
import dbAPI from 'src/static/db/index'

export default {
  name: 'PageIndex',
  created () {
    this.do_setup()
  },
  data () {
    return {
      name: '',
      vaultAddr: '',
      username: '',
      password: '',
      makeDefault: this.$store.state.settings.vaults.length > 0,
      importEngines: true
    }
  },
  methods: {
    do_setup () {
      dbAPI.configureVault({
        username: this.username,
        address: this.vaultAddr,
        password: this.password,
        makeDefault: this.makeDefault,
        name: this.name,
        importEngines: this.importEngines,
        onSuccess: (data) => {
          this.$store.dispatch('settings/setVaults', this.$store.state.settings.vaults.slice().concat([data]))
          this.$store.dispatch('settings/loginWithVault', data)

          var engine = 0
          for (var i = 0; i < data.engines.length; i++) {
            if (data.engines[i].isDefault) {
              engine = data.engines[i].id
              break
            }
          }

          this.$router.push('/' + data.id + '/' + engine + '/secrets').catch(() => console.log('Error going from setup to secrets'))
        },
        onError: () => {
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: 'Error setting up vault',
            icon: 'report_problem'
          })
        }
      })
    },
    reset () {
      this.vaultAddr = ''
      this.username = ''
      this.password = ''
      this.makeDefault = this.$store.state.settings.vaults.length > 0
    }
  }
}
</script>
