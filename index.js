var slice = Array.prototype.slice
var concat = Array.prototype.concat

var Brick = function() {
  var args = slice.call(arguments)

  if (!Brick.isBrick(this)) {
    var brick = Object.create(Brick.prototype)
    return Brick.apply(brick, args) || brick
  }

  var text = []
  if (args.length) { text = text.concat(args[0]) }
  var params = args.slice(1)

  this.text = text.reduce(function(memo, item) {
    if (Brick.isBrick(item)) {
      params = params.concat(item.params)
      return memo.concat(item.text)
    } else {
      return memo.concat(item)
    }
  }, [])

  this.params = params
}

Brick.defaults = {
  builder: null
}

Brick.isBrick = function(brick) {
 return typeof brick === 'object' && brick instanceof Brick
}

Brick.join = function(items, separator) {
  return new Brick(items.reduce(function(memo, item, index) {
    return memo.concat(index ? [separator, item] : item)
  }, []))
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
  return Brick.join(bricks, 'AND')
}

Brick.conditions = function(object) {
  return Brick.join(Object.keys(object).map(function(key) {
    return Brick.fn.equals(key, object[key])
  }), 'AND')
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

Brick.equal = function() {
  return slice.call(arguments).map(function(brick) {
    return brick.build()
  }).reduce(function(a, b) {
    return JSON.stringify(a) === JSON.stringify(b)
  })
}

Brick.fn = {}

Brick.fn.operator = function(operator, key, value) {
  var fn = function(key, value) {
    if (value === null) {
      return new Brick([key, 'IS NULL'])
    } else if (Brick.isBrick(value)) {
      return value
    } else {
      return new Brick([key, operator, '?'], value)
    }
  }
  var args = slice.call(arguments, 1)
  if (!args.length) { return fn }
  return fn.apply(null, args)
}

Brick.fn.equals = Brick.fn.operator('=')

Brick.fn.and = function(key, value) {
  return new Brick([key, 'AND', value])
}

Brick.fn.or = function(key, value) {
  return new Brick([key, 'OR', value])
}

Brick.fn.wrap = function(item) {
  return new Brick('(?)', item)
}

Brick.fn.join = function(separator, key, value) {
  var join = function(items) {
    return Brick.join(items, separator)
  }
  var items = slice.call(arguments, 1)
  if (!items.length) { return join }
  return join(items)
}

Brick.fn.namespace = function() {
  var parts = slice.call(arguments)
  return parts.filter(function(part) {
    return !!part
  }).join('.')
}

Brick.builders = {}

Brick.builders.pg = function(query) {
  var params = []

  // Replace parameter placeholders with $1, $2, etc.
  var text = query.params.reduce(function(memo, param) {
    var index = params.indexOf(param)
    if (index === -1) {
      index = params.length
      params.push(param);
    }
    var placeholder = '$' + (index + 1)
    return memo.replace('?', placeholder)
  }, query.text)

  return {
    text: text,
    values: params
  }
}

Brick.prototype._build = function() {
  // Make a copy of params
  var params = this.params.slice()

  // Join text array into a single string
  var text = this.text.join(' ')

  var left = '', right = text

  // Loop through params array, build any bricks that we find, and import
  // their contents.
  params = params.reduce(function(memo, param) {
    var placeholder = '?'
    if (Brick.isBrick(param)) {
      var result = param._build()
      placeholder = result.text
      param = result.params
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

  return {
    text: text,
    params: params
  }
}

Brick.prototype.build = function(builder) {
  builder = builder || Brick.defaults.builder
  var result = this._build()
  if (typeof Brick.builders[builder] === 'function') {
    return Brick.builders[builder](result)
  } else {
    return result
  }
}

Brick.prototype.toString = function() {
  var brick = this._build();
  var string = [brick.text].concat(brick.params).map(function(part) {
    return JSON.stringify(part)
  }).join(', ')

  return '[brick ' + string + ']'
}

module.exports = Brick
