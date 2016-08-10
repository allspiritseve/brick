# Brick

Build SQL strings without attempting to abstract away SQL.

## Usage:

```javascript
// Simple brick
var brick = require('brick')
var id = 1
var query = brick('SELECT * FROM events WHERE id = ?', id)
query.build() // => ['SELECT * FROM events WHERE id = ?', 1 ]

// Compose bricks with other bricks
var conditions = []
conditions.push(brick('category = ?', 'Blues'))
var query = brick('SELECT * FROM events WHERE ?', brick('category = ?', 'Blues'))
query.build() // => ['SELECT * FROM events WHERE category = ?', 'Blues']

// Write subqueries
var cities = brick('SELECT id FROM cities WHERE name = ?', 'Ann Arbor')
var query = brick('SELECT * FROM events WHERE city_id in (?)', cities)
query.build() // => ['SELECT * FROM events WHERE city_id in (SELECT id FROM cities WHERE name = ?)', 'Ann Arbor']

// Join bricks
var columns = []
columns.push(brick('id as event_id'))
columns.push('headline')
columns.push('city_id')
var query = brick('SELECT ? FROM events', brick.join(columns))
query.build() // => ['SELECT id as event_id, headline, city_id FROM events']
```
