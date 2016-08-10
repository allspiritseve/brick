var cadence = require('cadence')
var proof = require('proof')
var Brick = require('../..')
var sql = Brick.sql
var slice = Array.prototype.slice

proof(7, cadence(function(async, assert) {
  assert.brick = function(brick, sql) {
    var params = slice.call(arguments, 2)
    assert.deepEqual(brick.build(), [sql].concat(params))
  }

  async(function() {

    var brick = new Brick('SELECT * FROM events WHERE id = ?', 1)
    assert.deepEqual(brick.build(), ['SELECT * FROM events WHERE id = ?', 1])

  }, function() {

    var brick = new Brick(['SELECT *', 'FROM events', 'WHERE id = ?'], 1)
    assert.deepEqual(brick.build(), ['SELECT * FROM events WHERE id = ?', 1])

  }, function() {

    var list = []
    list.push(new Brick('id = ?', 1))
    list.push(new Brick('category = ?', 'approved'))
    var brick = Brick.join(list, ' AND ')
    assert.deepEqual(brick.build(), ['id = ? AND category = ?', 1, 'approved'])

  }, function() {

    var categories = new Brick('SELECT event_id FROM categories WHERE category = ?', 'blue')
    var events = new Brick('SELECT * FROM events WHERE id IN (?)', categories)
    assert.deepEqual(events.build(), ['SELECT * FROM events WHERE id IN (SELECT event_id FROM categories WHERE category = ?)', 'blue'])

  }, function() {

    var conditions = {}
    conditions.id = '3'
    conditions.color = 'blue'
    conditions.city = new Brick('city IS NULL')
    conditions.test = new Brick('count > ?', 4)
    var where = Brick.where(conditions)
    var query = new Brick('SELECT * FROM events WHERE ?', where)
    assert.deepEqual(query.build(), ['SELECT * FROM events WHERE id = ? AND color = ? AND city IS NULL AND count > ?', '3', 'blue', 4])

  }, function() {

    var table = Brick.namespace('events', { id: 3 })
    var where = Brick.where(table)
    assert.brick(where, 'events.id = ?', 3)

  }, function() {

    var where = new Brick()
    var query = new Brick('SELECT * FROM events WHERE ?', where)
    where.text.push('id = ?')
    where.params.push(1)
    assert.deepEqual(query.build(), ['SELECT * FROM events WHERE ?', []])
    where.text.push('AND', 'color = ?')
    where.params.push('Blue')
    assert.deepEqual(query.build(), ['SELECT * FROM events WHERE id = ? AND color = ?', 1, 'Blue'])

  })
}))



/*

DSL

    var items = ['uno', 'dos', 'tres']
    assert.equal(sql.list(items), 'uno, dos, tres')

    var brick = sql.where({ id: 1, category: 'blue' })
    assert.deepEqual(brick.build(), ['id = ? AND category = ?', 1, 'blue'])


sql.where({ id: 1, category: 'blue' })
> ['id = ? AND category = ?', 1, 'blue']

sql.where({ id: 1, category: null })
> ['id = ? AND category IS NULL', 1]

Goals:

Reduce repetitive code when building SQL
Avoid creating an SQL-like DSL. This library is merely for building SQL strings easily.



*/
