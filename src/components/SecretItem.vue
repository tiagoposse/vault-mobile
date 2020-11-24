<template>
  <q-dialog v-model="isOpen" :persistent="false" maximized @hide="editMode = false">
    <q-layout view="Lhh lpR fff" container class="bg-white" v-if="!itemIsEmpty">
      <q-header class="bg-primary">
        <q-toolbar>
          <q-toolbar-title>
            <q-input v-model="tempItem.path"
              dense
              v-if="editMode && mode == 'add'"
              placeholder="Secret name"
              autofocus
              :error="dataFieldHasError(tempItem.path)"
              error-message="Cannot be empty" />
            <div v-else>{{ tempItem.path }}</div>
          </q-toolbar-title>
          <div class="h5">v{{ mode ==='edit' ? secret.metadata.version : '1' }}</div>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page padding class="q-gutter-sm">
          <q-input v-model="tempItem.data[key]" :label="key"
              v-for="(val, key) in tempItem.data"
              :key="key"
              stack-label
              filled
              :readonly="!editMode"
              :error="dataFieldHasError(tempItem.data[key])"
              error-message="Cannot be empty"
              autogrow>
            <template v-slot:after v-if="editMode">
              <q-btn round dense flat icon="delete" @click="deleteKey(key)" />
            </template>
          </q-input>
          <template v-if="editMode">
            <q-input v-model="addKey" label="Key name"
                bottom-slots
                :error="!addKeyIsValid"
                error-message="Cannot be empty"
                stack-label>
              <template v-slot:after>
                <q-btn round dense flat icon="send" @click="addKeyToSecret()" />
              </template>
            </q-input>
          </template>
        </q-page>
      </q-page-container>

      <q-footer>
        <q-toolbar>
          <q-btn v-close-popup flat round dense icon="clear" />
          <q-toolbar-title></q-toolbar-title>

          <q-btn v-if="!editMode" @click="editMode = true" round flat dense icon="edit" />
          <template v-else>
            <q-btn label="Save Changes"
                flat
                v-if="hasChanges && mode === 'edit'"
                @click="updateSecret" />
            <q-btn label="Add Secret"
                flat
                v-if="hasChanges && mode === 'add'"
                @click="addSecret" />
            <q-btn label="Cancel" flat @click="editMode = false" v-if="mode !== 'add'" />
          </template>

          <q-btn round flat dense
            icon="delete"
            @click="deleteSecret"
            v-if="editMode && mode === 'edit'"
            style="margin-left: 10px;" />
        </q-toolbar>
      </q-footer>
    </q-layout>
  </q-dialog>
</template>

<script>
import dbAPI from 'src/static/db/index'

export default {
  props: {
    updateSecretInList: {
      type: Function,
      required: true
    },
    removeSecretFromList: {
      type: Function,
      required: true
    }
  },
  updated () {
    if (this.addKey.length > 0 && !this.addKeyIsValid) {
      this.addKeyIsValid = true
    }
  },
  data () {
    return {
      secret: null,
      tempItem: null,
      editMode: false,
      isOpen: false,
      addKey: '',
      addValue: '',
      mode: 'edit',
      dataIsValid: true,
      addKeyIsValid: true
    }
  },
  computed: {
    itemIsEmpty () {
      for (var elem in this.tempItem) {
        return false
      }
      return true
    },
    hasChanges () {
      for (const key in this.tempItem.data) {
        if (!Object.hasOwnProperty.call(this.secret, key) || this.tempItem.data[key] !== this.secret.data[key]) {
          return true
        }
      }

      for (const key in this.secret.data) {
        if (!Object.hasOwnProperty.call(this.secret, key)) {
          return true
        }
      }

      return this.tempItem.path !== this.secret.path
    },
    secretIsValid () {
      for (const key in this.tempItem.data) {
        if (this.tempItem.data[key].length === 0) {
          return false
        }
      }

      return this.tempItem.path.length !== 0
    }
  },
  methods: {
    dataFieldHasError (text) {
      return !this.dataIsValid && text.length === 0
    },
    startEdit (secret) {
      this.secret = secret
      this.tempItem = JSON.parse(JSON.stringify(secret))
      this.mode = 'edit'
      this.isOpen = true
    },
    startAdd () {
      this.secret = {
        path: '',
        data: {},
        metadata: {}
      }
      this.tempItem = {
        path: '',
        data: {
          username: '',
          password: '',
          notes: ''
        },
        metadata: {}
      }
      this.editMode = true
      this.mode = 'add'
      this.isOpen = true
    },
    deleteKey (key) {
      var newItem = Object.assign({}, this.tempItem)
      delete newItem.data[key]
      this.tempItem = newItem
    },
    addKeyToSecret () {
      if (this.addKey.length > 0) {
        this.addKeyIsValid = true
        var newItem = Object.assign({}, this.tempItem)
        newItem.data[this.addKey] = ''
        this.tempItem = newItem
      } else {
        this.addKeyIsValid = false
      }
    },
    resetEdit () {
      this.dataIsValid = true
      this.addKeyIsValid = true
      this.editMode = false
    },
    addSecret () {
      if (!this.secretIsValid) {
        this.dataIsValid = false
        return
      }

      var metadata = {
        version: 1
      }

      var newItem = Object.assign({}, this.tempItem, { metadata })

      if (newItem.path[0] !== '/') {
        newItem.path = '/' + newItem.path
      }

      dbAPI.insertSecret({
        secret: newItem,
        onSuccess: () => {
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Added secret ' + newItem.path,
            icon: 'success'
          })

          this.updateSecretInList(newItem)
          this.resetEdit()
          this.isOpen = false
        },
        onError: () => {
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Error adding secret ' + newItem.path,
            icon: 'success'
          })
        }
      })
    },
    updateSecret () {
      if (!this.secretIsValid) {
        this.dataIsValid = false
        return
      }

      dbAPI.updateSecret({
        secretId: this.tempItem.id,
        newItem: Object.assign({}, this.tempItem),
        oldItem: this.secret,
        lastSyncTime: this.$store.state.settings.last_sync_time,
        onSuccess: (updatedSecret) => {
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Updated secret ' + updatedSecret.path,
            icon: 'success'
          })

          this.updateSecretInList(updatedSecret)
          this.resetEdit()
        },
        onError: () => {
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Updated secret ' + this.tempItem.path,
            icon: 'success'
          })
        }
      })
    },
    deleteSecret () {
      this.$q.dialog({
        title: 'Confirm',
        message: 'Would you like to delete ' + this.tempItem.path,
        cancel: true,
        persistent: true
      }).onOk(() => {
        dbAPI.deleteSecret({
          onSuccess: () => {
            this.isOpen = false
            this.$q.notify({
              color: 'positive',
              position: 'top',
              message: 'Removed secret ' + this.tempItem.path,
              icon: 'success'
            })
            this.removeSecretFromList(this.tempItem.path)
            this.tempItem = {}
          },
          onError: (err) => console.log('Error deleting secret: ' + err),
          secretId: this.tempItem.id
        })
      }).onOk(() => {
        // console.log('>>>> second OK catcher')
      }).onCancel(() => {
      }).onDismiss(() => {
      })
    }
  }
}
</script>
