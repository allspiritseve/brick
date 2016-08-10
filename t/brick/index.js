var cadence = require('cadence')
var proof = require('proof')
var brick = require('../..')
var slice = Array.prototype.slice

var helpers = function(assert) {
  assert.brick = function(query, expected, message) {
    assert.deepEqual(query.build(), expected, message)
  }
}

proof(8, cadence(function(async, assert) {
  helpers(assert)

  async(function() {

    var query = brick('SELECT * FROM events WHERE id = ?', 1)
    assert.brick(query, ['SELECT * FROM events WHERE id = ?', 1], 'simple brick')

  }, function() {

    var query = brick(['SELECT *', 'FROM events', 'WHERE id = ?'], 1)
    assert.brick(query, ['SELECT * FROM events WHERE id = ?', 1], 'text array')

  }, function() {

    var conditions = []
    conditions.push(brick('id = ?', 1))
    conditions.push(brick('category = ?', 'approved'))
    var query = brick.join(conditions, ' AND ')
    assert.brick(query, ['id = ? AND category = ?', 1, 'approved'], 'join conditions')

  }, function() {

    var categories = brick('SELECT event_id FROM categories WHERE category = ?', 'blue')
    var events = brick('SELECT * FROM events WHERE id IN (?)', categories)
    assert.brick(events, ['SELECT * FROM events WHERE id IN (SELECT event_id FROM categories WHERE category = ?)', 'blue'], 'subquery')

  }, function() {

    var conditions = {}
    conditions.id = '3'
    conditions.color = 'blue'
    conditions.city = brick('city IS NULL')
    conditions.test = brick('count > ?', 4)
    var where = brick.where(conditions)
    var query = brick('SELECT * FROM events WHERE ?', where)
    assert.brick(query, ['SELECT * FROM events WHERE id = ? AND color = ? AND city IS NULL AND count > ?', '3', 'blue', 4], 'conditions')

  }, function() {

    var table = brick.namespace('events', { id: 3 })
    var where = brick.where(table)
    assert.brick(where, ['events.id = ?', 3], 'namespace')

  }, function() {

    var where = brick()
    var query = brick('SELECT * FROM events WHERE ?', where)
    where.text.push('id = ?')
    where.params.push(1)
    assert.brick(query, ['SELECT * FROM events WHERE id = ?', 1], 'lazy build 1')
    where.text.push('AND', 'color = ?')
    where.params.push('Blue')
    assert.brick(query, ['SELECT * FROM events WHERE id = ? AND color = ?', 1, 'Blue'], 'lazy build 2')

  })
}))
