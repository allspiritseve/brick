var slice = Array.prototype.slice

var Brick = function(sql) {
  var params = slice.call(arguments, 1)
  this.init(sql, params)

}

Brick.prototype.init = function(sql, params) {
  var brick

  if (params.length === 1 && Array.isArray(params[0])) {
    params = params[0]
  }

  if (Brick.isBrick(sql)) {
    brick = sql
  } else if (Array.isArray(sql)) {
    brick = Brick.join(sql, ' ')
  }

  if (brick) {
    sql = brick.sql
    params = params.concat(brick.params)
  }

  var left = ''
  var right = sql

  this.params = params.reduce(function(memo, param) {
    var replacement
    if (Brick.isBrick(param)) {
      replacement = param.sql
      memo = memo.concat(param.params)
    } else {
      replacement = '?'
      memo.push(param)
    }
    if (right) {
      var index = right.indexOf('?')
      if (index) {
        left = left + right.substr(0, index) + replacement
        right = right.substr(index + 1, right.length)
      }
    }
    return memo
  }, [])

  this.sql = left + right
}

Brick.isBrick = function(value) {
  return typeof value === 'object' && value instanceof Brick
}

Brick.join = function(items, separator) {
  var params = []
  separator = separator || ', '
  var sql = items.map(function(item) {
    if (Brick.isBrick(item)) {
      params = params.concat(item.params)
      return item.sql;
    } else {
      return item;
    }
  }).reduce(function(memo, item) {
    if (typeof separator === 'function') {
      return separator(memo, item)
    } else {
      return [memo, item].join(separator)
    }
  })
  return new Brick(sql, params)
}

Brick.map = function(object, separator) {
  return Object.keys(object).map(function(key) {
    var value = object[key]
    if (Brick.isBrick(value)) {
      return value
    }

    if (typeof separator === 'function') {
      return separator(key, value)
    }

    return new Brick([key, separator, '?'], value)
  })
}

Brick.where = function(object) {
  var bricks = Brick.map(object, Brick.fn.equals)
  return Brick.join(bricks, Brick.fn.and)
}

Brick.fn = {}

Brick.fn.equals = function(key, value) {
  if (value === null) {
    return new Brick([key, 'IS NULL'])
  } else {
    return new Brick([key, '= ?'], value)
  }
}

Brick.fn.and = function(key, value) {
  return new Brick([key, 'AND', value])
}

Brick.log = function(brick) {
  console.log('Brick', JSON.stringify({ sql: brick.sql, params: brick.params }, null, '  '))
}

Brick.prototype.log = function() {
  Brick.log(this)
}

Brick.Namespace = function(namespace) {
  Object.defineProperty(this, 'namespace', { value: namespace })
}

var sql = {}

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

sql.where = function(object) {
  var bricks = Object.keys(object).reduce(function(memo, key) {
    var value = object[key]
    if (value) {
      memo.push(new Brick([key, '= ?'], value))
    } else {
      memo.push(new Brick([key, 'IS NULL']))
    }
    return memo
  },  [])
  var sql = bricks.map(function(brick) { return brick.sql })
  var params = bricks.reduce(function(memo, brick) { return memo.concat(brick.params) }, [])
  return new Brick(list(sql, ' AND '), params)
}

var wrap = function(item, wrapper) {
  return [wrapper[0], item, wrapper[1]].join('')
};

var list = function(items, separator) {
  if (Array.isArray(items)) {
    return items.join(separator || ', ');
  }
};

var namespace = function(namespace, concatenator) {
  return function(name) {
    return [namespace, name].join(concatenator || '.')
  }
}

sql.wrap = wrap
sql.list = list
sql.namespace = namespace

Brick.prototype.build = function() {
  return [this.sql].concat(this.params)
}

Brick.sql = sql

module.exports = Brick
