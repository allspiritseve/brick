var Brick = require('.')

var query = new Brick(['id = ?', 'AND', new Brick('color = ?', 'Blue')], '3')
