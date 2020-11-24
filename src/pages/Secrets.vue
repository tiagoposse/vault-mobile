<template>
  <q-page>
    <div class="row">
      <q-input dense v-model="filter" placeholder="Search..." class="col-10" style="padding-left: 12px">
        <template v-slot:prepend>
          <q-icon name="fas fa-search" />
        </template>
      </q-input>
      <q-btn icon="add" @click="startAddSecret" flat dense round class="col-2" />
    </div>
    <q-list padding>
      <q-expansion-item
        dense
        dense-toggle
        expand-separator
        :label="folder"
        v-for="(values, folder) in secretList"
        :key="folder"
      >
        <q-card>
          <q-card-section>
            <q-list>
              <q-item v-for="(val, i) in values" :key="i">
                <q-item-section>
                  <q-item-label>{{ val.path.substring(1) }}</q-item-label>
                  <q-item-label caption lines="2">v{{ val.metadata.version }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn icon="far fa-eye" flat round size="10px" @click="openSecretDialog(val.path)"/>
                    <q-btn icon="far fa-copy" flat round size="10px" @click="secretToClipboard(val.id)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
    <SecretItem ref="secretDialog" :updateSecretInList="updateSecret" :removeSecretFromList="deleteSecret" />
  </q-page>
</template>

<script>
import SecretItem from 'components/SecretItem'
import { copyToClipboard } from 'quasar'
import dbAPI from 'src/static/db/index'

export default {
  components: {
    SecretItem
  },
  created () {
    console.log('Sync:')
    dbAPI.sync({
      onSuccess: (syncTime) => {
        this.$store.dispatch('settings/updateLastSyncTime', syncTime)
        console.log('sync ok')
        this.requestSecrets()
      },
      onError: () => {
        console.log('sync fail')
        this.requestSecrets()
      },
      lastSyncTime: this.$store.state.settings.last_sync_time
    })
  },
  data () {
    return {
      secrets: {},
      filter: ''
    }
  },
  computed: {
    secretList () {
      var retSecrets = {
        unmapped: []
      }

      for (const path in this.secrets) {
        if (path.includes(this.filter)) {
          if (path.charAt(path.length - 1) === '/') {
            retSecrets[path.substring(0, path.length - 1)] = []
          } else {
            retSecrets.unmapped.push(this.secrets[path])
          }
        }
      }

      return retSecrets
    }
  },
  methods: {
    updateSecret (item) {
      var newSecrets = Object.assign({}, this.secrets)
      newSecrets[item.path] = item
      this.secrets = newSecrets
    },
    deleteSecret (path) {
      var newSecrets = Object.assign({}, this.secrets)
      delete newSecrets[path]
      this.secrets = newSecrets
    },
    requestSecrets () {
      dbAPI.listSecrets({
        onSuccess: (secrets) => {
          this.secrets = secrets
        },
        onError: () => {
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: 'Error retrieving local secrets',
            icon: 'report_problem'
          })
        }
      })
    },
    startAddSecret () {
      this.$refs.secretDialog.startAdd({})
    },
    openSecretDialog (path) {
      var ret = (data) => {
        var secret = Object.assign({}, this.secrets[path], { data })

        this.$refs.secretDialog.startEdit(secret)
      }

      this.readSecret(this.secrets[path].id, ret)
    },
    readSecret (secretId, onSuccess) {
      dbAPI.getSecretValues({
        secretId,
        onSuccess
      })
    },
    secretToClipboard (secretId) {
      var ret = (data) => {
        var copy = ''
        if (Object.prototype.hasOwnProperty.call(data, 'password')) {
          copy = data.password
        } else if (Object.prototype.hasOwnProperty.call(data, 'key')) {
          copy = data.key
        } else {
          copy = data[Object.keys(data)[0]]
        }

        copyToClipboard(copy)
          .then(() => {
            this.$q.notify({
              color: 'positive',
              position: 'top',
              message: 'Copied to clipboard!',
              icon: 'success'
            })
          })
          .catch(() => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Copying failed',
              icon: 'report_problem'
            })
          })
      }

      this.readSecret(secretId, ret)
    }
  }
}
</script>
