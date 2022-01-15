var express = require('express')
var app = express()
var expressMongoDb = require('express-mongo-db');
var config = require('./config')
app.use(express.static('public'));
app.use(expressMongoDb(config.database.url));


app.set('view engine', 'ejs')


var index = require('./routes/index')
var admin = require('./routes/admin')
var users = require('./routes/users');

var expressValidator = require('express-validator')
app.use(expressValidator())
 
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())



var methodOverride = require('method-override')

app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

var flash = require('express-flash')
var cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(cookieParser('keyboard cat'))
app.use(session({ 
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: { maxAge: 600000 }
}))
app.use(flash())

app.use('/', index)
app.use('/admin', admin.app)
app.use('/users',users.app);

app.listen(3000, function(){
	console.log('Server running at port 3000: http://127.0.0.1:3000')
})
