
var secrets = {
  id: {
    primary_key: true,
    type: 'integer'
  },
  path: {
    encrypt: true
  },
  version: {
    type: 'integer',
    not_null: true,
    encrypt: true
  },
  lastUpdated: {
    type: 'long',
    not_null: true,
    encrypt: true
  },
  createdTime: {
    type: 'long',
    not_null: true,
    encrypt: true
  },
  destroyed: {
    type: 'integer',
    default: 0,
    encrypt: true
  }
}

var secretValues = {
  id: {
    primary_key: true,
    type: 'integer'
  },
  secret_id: {
    foreign_key: {
      table: 'secrets',
      field: 'id'
    },
    not_null: true,
    type: 'integer'
  },
  field_name: {},
  value: {
    encrypt: true
  }
}

var settings = {
  vaultAddr: {},
  vaultEngine: {},
  syncPeriod: {
    type: 'INT',
    default: 0
  },
  lastSyncTime: {
    type: 'long',
    default: 0
  }
}

var users = {
  username: {
    unique: true,
    primary_key: true
  },
  password: {
    not_null: true
  },
  salt: {
    not_null: true
  },
  encryptionKey: {
    not_null: true
  },
  biometricLogin: {
    type: 'integer',
    default: 0
  }
}

var fingerprints = {
  id: {
    primary_key: true,
    type: 'integer'
  },
  user: {
    not_null: true,
    foreign_key: {
      table: 'users',
      field: 'username'
    }
  },
  encryptionKey: {
    not_null: true
  },
  salt: {
    not_null: true
  }
}

export default {
  secrets,
  secret_values: secretValues,
  settings,
  fingerprints,
  users
}
