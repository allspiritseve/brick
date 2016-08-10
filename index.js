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
    params = params.concat(sql.params)
    sql = params.sql
  } else if (Array.isArray(sql)) {
    sql = sql.map(function(item) {
      if (Brick.isBrick(item)) {
        params = params.concat(item.params)
        return item.sql
      } else {
        return item
      }
    }).join(' ')
  }

  console.log({ sql: sql, params: params })

  var parts = sql.split('?').reduce(function(memo, text, index) {
    if (text === '') { return memo }
    memo.text += text
    var param = params[index]
    if (Brick.isBrick(param)) {
      memo.text += param.sql
      memo.params = memo.params.concat(param.params)
    } else {
      memo.text += '?'
      memo.params.push(param)
    }
    return memo
  }, { text: [], params: [] })

  console.log('parts', parts)

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

Brick.fn.namespace = function() {
  var parts = slice.call(arguments)
  return parts.filter(function(part) {
    return !!part
  }).join('.')
}

Brick.log = function(brick) {
  console.log('Brick', JSON.stringify({ sql: brick.sql, params: brick.params }, null, '  '))
}

Brick.prototype.log = function() {
  Brick.log(this)
}

Brick.namespace = function(namespace, value) {
  var fn = function(value) { return Brick.fn.namespace(namespace, value) }
  if (!value) { return fn }
  if (typeof value === 'object') {
    if (Array.isArray(value)) { return value.map(fn) }
    return Object.keys(value).reduce(function(memo, key) {
      memo[fn(key)] = value[key]
      return memo
    }, {})
  } else {
   return fn(value)
  }
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
