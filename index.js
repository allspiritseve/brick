var slice = Array.prototype.slice
var concat = Array.prototype.concat

var Brick = function() {
  if (!Brick.isBrick(this)) {
    var args = slice.call(arguments)
    var brick = Object.create(Brick.prototype)
    return Brick.apply(brick, args) || brick
  }

  this.text = []
  this.params = []
  var input = slice.call(arguments)
  if (input.length) {
    this.text = concat.apply(this.text, [input.shift()])
    this.params = concat.apply(this.params, input)
  }
}

Brick.isBrick = function(value) {
 return typeof value === 'object' && value instanceof Brick
}

Brick.join = function(items, separator) {
  var params = []
  separator = separator || ', '
  var text = items.map(function(item) {
    if (Brick.isBrick(item)) {
      return item.merge(params)
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
  return new Brick(text, params)
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

Brick.prototype.merge = function(params) {
  var sql = this.build()
  sql.slice(1).forEach(function(param) { params.push(param) })
  return sql[0]
}

Brick.prototype.build = function() {
  // Make a copy of params
  var params = this.params.slice()

  // Combine text array into a single string, extracting params from any bricks
  // that are found.
  var text = this.text.map(function(item) {
    if (Brick.isBrick(item)) {
      return item.merge(params)
    } else {
      return item
    }
  }).join(' ')

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

Brick.prototype.toString = function() {
  var string = this.build().map(function(part) {
    return JSON.stringify(part)
  }).join(', ')

  return '[brick ' + string + ']'
}

module.exports = Brick
