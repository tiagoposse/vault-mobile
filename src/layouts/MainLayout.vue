<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          {{ $store.getters['settings/getCurrentVault'].name }}
        </q-toolbar-title>

        <div>Sync: {{ formattedDate }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-1"
    >
      <q-list>
        <q-expansion-item
            expand-separator
            :label="vault"
            v-for="(data, vault) in links"
            :key="vault"
            :value="openVault === vault"
            :header-class="openVault === vault ? 'bg-primary' : 'bg-teal-4'">
          <q-list>
            <EssentialLink
              v-for="link in data"
              :key="link.title"
              v-bind="link"
            />
          </q-list>
        </q-expansion-item>
        <EssentialLink
          title="Settings"
          link="/settings"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import EssentialLink from 'components/EssentialLink.vue'

export default {
  name: 'MainLayout',
  components: { EssentialLink },
  data () {
    return {
      leftDrawerOpen: false,
      openVault: this.$store.getters['settings/getCurrentVault'].name
    }
  },
  computed: {
    links () {
      var links = {}
      for (var i = 0; i < this.$store.state.settings.vaults.length; i++) {
        var vault = this.$store.state.settings.vaults[i]

        links[vault.name] = []
        for (var k = 0; k < vault.engines.length; k++) {
          links[vault.name].push({
            title: vault.engines[k].name,
            link: '/' + vault.id + '/' + vault.engines[k].id + '/secrets'
          })
        }
      }

      return links
    },
    formattedDate () {
      var a = new Date(this.$store.getters['settings/getCurrentVault'].lastSyncTime)

      // var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      var year = a.getFullYear().toString().substring(2)
      var month = a.getMonth()
      var date = a.getDate()
      var hour = a.getHours()
      var min = a.getMinutes()
      var sec = a.getSeconds()
      var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec

      return time
    }
  }
}
</script>

<style scoped>
  .active-link {
    background-color: blue;
  }
</style>
