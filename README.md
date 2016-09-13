# Brickmason

Build SQL strings without attempting to abstract away SQL.

## Philosophy:

Writing raw SQL is fun, but there are occasional pain points, such as
conditionally appending expressions or converting an object into a WHERE
clause. Brickmason makes those things easier, but otherwise gets out of
your way.

A brick in its simplest form is an SQL expression and an array of parameters.
Bricks can be composed from arrays containing strings, objects, or other
bricks, but ultimately they are reduced down to an expression string and an
array of parameters.

If any parameters are present, the SQL expression must specify their position
with a placeholder `?`.

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
