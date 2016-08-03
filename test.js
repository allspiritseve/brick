var Brick = require('.')

var query = new Brick('to_tsquery(?)', '^ge_jasco')
var rank = new Brick("ts_rank(document, ?)", query)
var sql = new Brick("SELECT ? FROM upcs WHERE document @@ ?", query, rank)
sql.log()
