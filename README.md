# Brick

Build SQL strings without attempting to abstract away SQL.

## Usage:

```javascript
var brick = require('brick')
var id = 1
var query = brick('SELECT * FROM events WHERE id = ?', id)
query.build() // => ['SELECT * FROM events WHERE id = ?', 1 ]
```
