var express = require('express')
var app = express()

app.get('/', function(req, res) {
	// render to views/index.ejs template file
	res.render('user/home', {title: 'Cooper Player'})
})

module.exports = app;
