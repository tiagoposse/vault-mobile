import utils from './utils'
import tables from './tables'

var encryptionKey
function setEncryptionKey (key) {
  encryptionKey = key
}

function insert ({ tx, table, values, onSuccess, onError }) {
  var valArray = []
  var placeholders = []
  var valuesKeys = Object.keys(values)

  for (var i = 0; i < valuesKeys.length; i++) {
    placeholders.push('?')
    if (Object.hasOwnProperty.call(tables[table][valuesKeys[i]], 'encrypt') && tables[table][valuesKeys[i]].encrypt) {
      valArray.push(utils.encrypt(values[valuesKeys[i]].toString(), encryptionKey))
    } else {
      valArray.push(values[valuesKeys[i]])
    }
  }

  tx.executeSql('INSERT INTO ' + table + '(' + valuesKeys.join(',') + ') VALUES (' + placeholders.join(', ') + ')', valArray, function (tx, rs) {
    onSuccess(rs.insertId)
  }, function (tx, error) {
    console.log('Insert error: ' + error.message)
    onError()
  })
}

function update ({ tx, table, values, whereFields = [], onSuccess, onError }) {
  var valArray = []
  var placeholders = []
  var whereClause = ''

  for (const key in values) {
    placeholders.push(key + ' = ?')

    if (Object.hasOwnProperty.call(tables[table][key], 'encrypt') && tables[table][key].encrypt) {
      valArray.push(utils.encrypt(values[key].toString(), encryptionKey))
    } else {
      valArray.push(values[key])
    }
  }

  if (whereFields.length > 0) {
    var where = []

    for (var k = 0; k < whereFields.length; k++) {
      where.push(whereFields[k].field + ' = ?')
      valArray.push(whereFields[k].value)
    }
    whereClause = ' where ' + where.join(' AND ')
  }

  tx.executeSql('UPDATE ' + table + ' SET ' + placeholders.join(', ') + whereClause, valArray, function (tx, rs) {
    onSuccess(rs)
  }, function (tx, error) {
    console.log('UPDATE error: ' + error.message)
    onError(error)
  })
}

function deleteFromTable ({ tx, table, whereFields = [], onSuccess, onError, overrideWhereStr = '', overrideWhereValues = [] }) {
  var valArray = []
  var whereStr = ''

  if (overrideWhereStr === '') {
    var where = []
    for (var i = 0; i < whereFields.length; i++) {
      where.push(whereFields[i].field + ' = ?')
      valArray.push(whereFields[i].value)
    }
    whereStr = where.join(' AND ')
  } else {
    whereStr = overrideWhereStr
    valArray = overrideWhereValues
  }

  tx.executeSql('DELETE FROM ' + table + ' where ' + whereStr, valArray, function (tx, rs) {
    onSuccess(rs)
  }, function (tx, error) {
    console.log('DELETE error: ' + error.message)
    onError()
  })
}

export default {
  insert: utils.transactionDecorator(insert),
  update: utils.transactionDecorator(update),
  deleteFromTable: utils.transactionDecorator(deleteFromTable),
  setEncryptionKey
}
