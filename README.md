# Brickmason

Build SQL strings without attempting to abstract away SQL.

## Philosophy:

Writing raw SQL is fun, but there are occasional pain points, such as
conditionally appending expressions or converting an object into a WHERE
clause. Brickmason makes those things easier, but otherwise gets out of
your way.

A brick in its simplest form is an array of SQL strings and an array of parameters.
Bricks can be composed from strings, objects, or other
bricks, but ultimately they are reduced down to an SQL string and an
array of parameters.

If any parameters are present, the SQL expression must specify their position
with a placeholder `?`. Parameters can be scalar values or bricks. If a brick
is passed as a parameter, it will replace the placeholder when the query is
built.

## Usage:

### Simple brick
```javascript
var brick = require('brickmason')
var id = 1
var query = brick('SELECT * FROM events WHERE id = ?', id)
query.build() // => { text: 'SELECT * FROM events WHERE id = $1', params: [1] }
```

### Compose bricks with other bricks
```javascript
var brick = require('brickmason')
var conditions = []
conditions.push(brick('category = ?', 'Blues'))
var query = brick('SELECT * FROM events WHERE ?', brick('category = ?', 'Blues'))
query.build() // => { text: 'SELECT * FROM events WHERE category = $1', params: ['Blues'] }
```

### Write subqueries
```javascript
var brick = require('brickmason')
var cities = brick('SELECT id FROM cities WHERE name = ?', 'Ann Arbor')
var query = brick('SELECT * FROM events WHERE city_id in (?)', cities)
query.build() // => { text: 'SELECT * FROM events WHERE city_id in (SELECT id FROM cities WHERE name = $1)', params: ['Ann Arbor'] }
```

### Join bricks
```javascript
var brick = require('brickmason')
var columns = []
columns.push(brick('id as event_id'))
columns.push('headline')
columns.push('city_id')
var query = brick('SELECT ? FROM events', brick.join(columns))
query.build() // => { text: 'SELECT id as event_id, headline, city_id FROM events', params: [] }
```

### Conditions
```javascript
var brick = require('brickmason')
var where = brick.conditions({
  city: 'Ann Arbor',
  category: 'Jazz',
  deleted_at: null
})
var query = brick('SELECT * FROM events WHERE ?', where)
query.build() // => { text: 'SELECT * FROM events WHERE city = ? AND category = ? AND deleted_at IS NULL', params: ['Ann Arbor', 'Jazz'] }
```

### Complex conditions
```javascript
var brick = require('brickmason')
var searches = [
  { generic_type: 128, specific_type: 256 },
  { generic_type: 128, specific_type: null },
]

var clauses = searches.map(function(search) {
  return brick.fn.wrap(brick.conditions(search))
})

var where = brick.join(clauses, 'OR')

var query = brick('SELECT * FROM devices WHERE ?', where)
query.build() // => { text: 'SELECT * FROM devices WHERE (generic_type = ? AND specific_type = ?) OR (generic_type = ? AND specific_type IS NULL)', params: ['128', '256'] }
```

## Using Brickmason with Postgresql
```javascript
var pg = require('pg')
var brick = require('brickmason')

var query = brick(/* ... */)

pg.connect('database', function(client, done) {
  client.query(query.build('pg'), function(result) {
    // handle result...
    done()
  })
})
```
