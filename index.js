var slice = Array.prototype.slice
var concat = Array.prototype.concat

var splitAt = function(string, index) {
  return [string.substr(0, index), string.substr(index + 1)]
}

var Brick = function() {
  this.text = []
  this.params = []
  var input = slice.call(arguments)
  if (input) {
    this.text = concat.apply(this.text, [input.shift()])
    this.params = concat.apply(this.params, input)
  }
  console.log('brick', { text: this.text, params: this.params })
}

Brick.prototype.build = function() {
  // Make a copy of params
  var params = this.params.slice()

  // Combine text array into a single string, extracting params from any bricks
  // that are found.
  var text = this.text.map(function(item) {
    if (Brick.isBrick(item)) {
      item = item.build()
      params = params.concat(item.slice(1))
      return item[0]
    } else {
      return item
    }
  }).join(' ')

  console.log('brick 2', { text: text, params: params })

  // Loop through params array, build any bricks that we find, and import
  // their contents.
  var left = '', right = text
  params = params.reduce(function(memo, param) {
    var placeholder = '?'
    if (Brick.isBrick(param)) {
      param = param.build()
      placeholder = param[0]
      param = param.slice(1)
    }
    memo = memo.concat(param)
    if (right) {
      var index = right.indexOf('?')
      if (index !== -1) {
        left = left + right.substr(0, index) + placeholder
        right = right.substr(index + 1)
      }
    }
    return memo
  }, [])
  text = left + right

  // Return results as a single array
  return [text].concat(params)
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

Brick.sql = sql

module.exports = Brick
