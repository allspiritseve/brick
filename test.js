var Brick = require('.')

var query = new Brick([new Brick('color = ?', 'Blue'), 'AND', 'id = ?'], '3')
console.log('query', query.build())
