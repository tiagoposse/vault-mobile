import basics from './basics'
import utils from './utils'

function readSettings ({ tx, onSuccess, onError }) {
  tx.executeSql('SELECT * FROM settings', [], function (tx, rs) {
    if (rs.rows.length > 0) {
      onSuccess(rs.rows.item(0))
    } else {
      onSuccess(false)
    }
  }, function (tx, error) {
    console.log('readSettings error: ' + error.message)
  })
}

function createSettings ({ vaultAddr, vaultEngine, onSuccess }) {
  readSettings({
    onSuccess: (rows) => {
      if (rows.length > 0) {
        onSuccess(false)
      } else {
        basics.insert({
          table: 'settings',
          values: { vaultAddr, vaultEngine },
          onSuccess
        })
      }
    }
  })
}

export default {
  readSettings: utils.transactionDecorator(readSettings),
  createSettings
}
