var slice = Array.prototype.slice

var Brick = function(sql) {
  if (Array.isArray(sql)) {
    this.sql = sql.join(' ')
  } else {
    this.sql = sql
  }
  this.params = slice.call(arguments, 1)
}

Brick.prototype.log = function() {
  console.log('Brick', this, JSON.stringify({ sql: this.sql, params: this.params }, null, '  '))
}

var sql = {}

Brick.Equals = function(exp) {
  this.exp = exp;
}

Brick.Equals.prototype.equals = function(value) {
  if (value === null) {
    return new Brick([this.exp, 'IS NULL'])
  } else {
    return new Brick([this.exp, '= ?'], value)
  }
}

sql.interpolate = function(exp) {
  var replacements = slice.call(arguments, 1)
}

sql.equals = function(exp, value) {
  return new Brick([exp, '= ?'], value)
}


sql.isNull = function(exp) {
  return new Brick([exp, 'IS NULL'])
}

sql.if = function(value, brick, nullBrick) {
  if (value === null) {
    return nullBrick
  } else {
    return brick
  }
}

sql.orNull = function(exp, value) {
  if (value === null) {
    return sql.isNull(exp)
  } else {
    return sql.equals(exp, value)
  }
}

Brick.sql = sql

module.exports = Brick
