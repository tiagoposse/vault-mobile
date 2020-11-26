
var secrets = {
  id: {
    primary_key: true,
    type: 'integer'
  },
  path: {
    encrypt: true,
    not_null: true
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
  },
  engine: {
    foreign_key: {
      table: 'engines',
      field: 'id'
    },
    not_null: true
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

var engines = {
  id: {
    primary_key: true,
    type: 'integer'
  },
  vault: {
    foreign_key: {
      table: 'vaults',
      field: 'id'
    },
    type: 'integer'
  },
  name: {
    not_null: true
  },
  isDefault: {
    type: 'integer', // bool
    default: 0
  }
}

var vaults = {
  id: {
    primary_key: true,
    type: 'integer'
  },
  name: {
    not_null: true,
    unique: true
  },
  address: {
    not_null: true,
    unique: true
  },
  syncPeriod: {
    type: 'integer',
    default: 0
  },
  lastSyncTime: {
    type: 'long',
    default: 0
  },
  offlineMode: {
    type: 'integer', // bool
    default: 1
  },
  username: {
    not_null: true
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
    type: 'integer', // bool
    default: 0
  },
  isDefault: {
    type: 'integer', // bool
    default: 0
  }
}

var fingerprints = {
  id: {
    primary_key: true,
    type: 'integer'
  },
  vault: {
    not_null: true,
    foreign_key: {
      table: 'vaults',
      field: 'id'
    }
  },
  encryptionKey: {
    not_null: true
  },
  vaultPassword: {
    not_null: true
  }
}

export default {
  secrets,
  secret_values: secretValues,
  fingerprints,
  vaults,
  engines
}
