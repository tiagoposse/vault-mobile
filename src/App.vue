<template>
  <div id="q-app" v-if="$store.state.settings.ready">
    <router-view />
  </div>
</template>
<script>
import dbAPI from 'src/static/db/index'

export default {
  name: 'App',
  updated () {
    console.log(this.$store.state.settings.ready)
  },
  created () {
    var store = this.$store
    var router = this.$router

    document.addEventListener('deviceready', function () {
      dbAPI.open(store.state)
      dbAPI.populateDB()
      dbAPI.readSettings({
        onSuccess: (result) => {
          if (!result) {
            router.push('/setup').catch((err) => {
              console.log('Redirecting to setup unsuccessful: ' + err)
            })
          } else {
            store.dispatch('settings/setInitSettings', result)
          }
        }
      })
    })
  }
}
</script>
