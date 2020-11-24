<template>
  <q-page class="flex flex-center">
    <div class="row full-width justify-center">
      <q-form
        @submit="do_setup"
        @reset="reset"
        class="q-gutter-md col-2"
      >
        <q-input
          filled
          v-model="vault_addr"
          label="Vault Address"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please type something']"
        />

        <q-input
          filled
          v-model="vault_engine"
          label="Vault Secret Engine"
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
      vault_addr: '',
      vault_engine: ''
    }
  },
  methods: {
    do_setup () {
      console.log('do setup')
      // var settings = {
      //   vaultAddr: this.vault_addr,
      //   vaultEngine: this.vault_engine
      // }
      var settings = {
        vaultAddr: 'https://vault.tiagoposse.com',
        vaultEngine: 'kv'
      }

      dbAPI.createSettings({
        ...settings,
        onSuccess: () => {
          console.log('SUCCESS:')
          this.$store.dispatch('settings/setInitSettings', settings)
          this.$router.push('/login').catch('Error going from setup to login')
        }
      })
    },
    reset () {
      this.vault_addr = ''
      this.vault_engine = ''
    }
  }
}
</script>
