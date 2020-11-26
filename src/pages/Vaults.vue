<template>
  <q-list>
    <q-item v-for="(vault, index) in vaults" :key="index" @click="goToVault(index)">{{ vault.name }}</q-item>
  </q-list>
</template>

<script>
export default {
  methods: {
    goToVault (index) {
      this.$store.dispatch('settings/setActiveVault', index)
      this.$store.push('/')
    }
  }
}
</script>