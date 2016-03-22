var cadence = require('cadence')
var proof = require('proof')
var Brick = require('../..')

proof(2, cadence(function(async, assert) {
  async(function() {

    var brick = new Brick('SELECT * FROM events WHERE id = ?', 1)

  }, function() {

    assert.equal(brick.sql, 'SELECT * FROM events WHERE id = ?')
    assert.deepEquals(brick.params, [1])

  })
}))
