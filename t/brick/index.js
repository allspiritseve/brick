var cadence = require('cadence')
var proof = require('proof')
var Brick = require('../..')
var sql = Brick.sql
var slice = Array.prototype.slice

var helpers = function(assert) {
  assert.brick = function(brick, expected, message) {
    assert.deepEqual(brick.build(), expected, message)
  }
}

proof(8, cadence(function(async, assert) {
  helpers(assert)

  async(function() {

    var brick = new Brick('SELECT * FROM events WHERE id = ?', 1)
    assert.brick(brick, ['SELECT * FROM events WHERE id = ?', 1], 'simple brick')

  }, function() {

    var brick = new Brick(['SELECT *', 'FROM events', 'WHERE id = ?'], 1)
    assert.brick(brick, ['SELECT * FROM events WHERE id = ?', 1], 'text array')

  }, function() {

    var conditions = []
    conditions.push(new Brick('id = ?', 1))
    conditions.push(new Brick('category = ?', 'approved'))
    var brick = Brick.join(conditions, ' AND ')
    assert.brick(brick, ['id = ? AND category = ?', 1, 'approved'], 'join conditions')

  }, function() {

    var categories = new Brick('SELECT event_id FROM categories WHERE category = ?', 'blue')
    var events = new Brick('SELECT * FROM events WHERE id IN (?)', categories)
    assert.brick(events, ['SELECT * FROM events WHERE id IN (SELECT event_id FROM categories WHERE category = ?)', 'blue'], 'subquery')

  }, function() {

    var conditions = {}
    conditions.id = '3'
    conditions.color = 'blue'
    conditions.city = new Brick('city IS NULL')
    conditions.test = new Brick('count > ?', 4)
    var where = Brick.where(conditions)
    var query = new Brick('SELECT * FROM events WHERE ?', where)
    assert.brick(query, ['SELECT * FROM events WHERE id = ? AND color = ? AND city IS NULL AND count > ?', '3', 'blue', 4], 'conditions')

  }, function() {

    var table = Brick.namespace('events', { id: 3 })
    var where = Brick.where(table)
    assert.brick(where, ['events.id = ?', 3], 'namespace')

  }, function() {

    var where = new Brick()
    var query = new Brick('SELECT * FROM events WHERE ?', where)
    where.text.push('id = ?')
    where.params.push(1)
    assert.brick(query, ['SELECT * FROM events WHERE id = ?', 1], 'lazy build 1')
    where.text.push('AND', 'color = ?')
    where.params.push('Blue')
    assert.brick(query, ['SELECT * FROM events WHERE id = ? AND color = ?', 1, 'Blue'], 'lazy build 2')

  })
}))
