<template>
  <div id="q-app">
    <router-view v-if="$store.state.settings.ready" />
  </div>
</template>
<script>
import dbAPI from 'src/static/db/index'

export default {
  name: 'App',
  created () {
    document.addEventListener('deviceready', () => {
      dbAPI.open(this.$store.state)
      dbAPI.populateDB()
      dbAPI.listConfiguredVaults({
        onSuccess: (result) => {
          if (result.length > 0) {
            this.$store.dispatch('settings/setVaults', result)
          } else {
            this.$router.push('/setup').catch((err) => console.log(err))
          }

          this.$store.dispatch('settings/setReady')
        }
      })
    })
  }
}
</script>
