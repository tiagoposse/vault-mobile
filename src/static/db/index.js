
import syncDB from './sync'
import vaultsDB from './vaults'
import secretsDB from './secrets'
import basicsDB from './basics'
import utils from './utils'
import tables from './tables'

function open (appState) {
  var db = window.sqlitePlugin.openDatabase({
    name: 'vaultmobile.db',
    location: 'default'
  })

  utils.initUtils(db)
}

var populateDB = utils.transactionDecorator(({ tx }) => {
  tx.executeSql('PRAGMA foreign_keys=ON ')

  var fieldStrings = getTableString(tables.vaults)
  tx.executeSql('CREATE TABLE IF NOT EXISTS vaults (' + fieldStrings.join(', ') + ')')

  fieldStrings = getTableString(tables.engines)
  tx.executeSql('CREATE TABLE IF NOT EXISTS engines (' + fieldStrings.join(', ') + ')')

  fieldStrings = getTableString(tables.secrets)
  tx.executeSql('CREATE TABLE IF NOT EXISTS secrets (' + fieldStrings.join(', ') + ')')

  fieldStrings = getTableString(tables.secret_values)
  tx.executeSql('CREATE TABLE IF NOT EXISTS secret_values (' + fieldStrings.join(', ') + ')')

  fieldStrings = getTableString(tables.fingerprints)
  tx.executeSql('CREATE TABLE IF NOT EXISTS fingerprints (' + fieldStrings.join(', ') + ')')
})

function getTableString (table) {
  var keys = Object.keys(table)
  var fieldStrings = []
  var foreignKeys = []

  for (var i = 0; i < keys.length; i++) {
    var initStr = keys[i]

    var fieldKeys = Object.keys(table[keys[i]])

    if (fieldKeys.includes('type')) {
      initStr += ' ' + table[keys[i]].type
    } else {
      initStr += ' varchar'
    }

    if (fieldKeys.includes('not_null')) {
      initStr += ' NOT NULL'
    } else if (fieldKeys.includes('default')) {
      initStr += ' DEFAULT ' + table[keys[i]].default
    }

    if (fieldKeys.includes('primary_key') && table[keys[i]].primary_key) {
      initStr += ' primary key'
      if (fieldKeys.includes('type') && table[keys[i]].type === 'integer') {
        initStr += ' autoincrement'
      }
    } else if (fieldKeys.includes('unique') && table[keys[i]].unique) {
      initStr += ' unique'
    }

    fieldStrings.push(initStr)
    if (fieldKeys.includes('foreign_key')) {
      foreignKeys.push('FOREIGN KEY(' + keys[i] + ') REFERENCES ' + table[keys[i]].foreign_key.table + '(' + table[keys[i]].foreign_key.field + ')')
    }
  }

  return fieldStrings.concat(foreignKeys)
}

export default {
  open,
  populateDB,
  ...syncDB,
  ...basicsDB,
  ...secretsDB,
  ...vaultsDB,
  ...utils
}
