var express = require('express')

var app = express()
var ObjectId = require('mongodb').ObjectId

// SHOW LIST OF USERS
app.get('/:action', function(req, res, next) {	
	// fetch and sort users collection by id in descending order
	if(req.params.action==="song"){
	req.db.collection('songs').find().sort({"_id": -1}).toArray(function(err, result) {
		//if (err) return console.log(err)
		if (err) {
			req.flash('error', err)
			res.render('admin/list', {
				title: 'Song List',
				type: 'song',  
				data: ''
			})
		} else {
			// render to views/admin/list.ejs template file
			res.render('admin/list', {
				title: 'Song List',
				type: 'song', 
				data: result	
			})
		}
	})
	}
	else if(req.params.action==="plan"){
		req.db.collection('plans').find().sort({"_id": -1}).toArray(function(err, result) {
			//if (err) return console.log(err)
			if (err) {
				req.flash('error', err)
				res.render('admin/list', {
					title: 'Plan List', 
					type: 'plan',
					data: ''
				})
			} else {
				// render to views/admin/list.ejs template file
				res.render('admin/list', {
					title: 'Plan List', 
					type:'plan',
					data: result
				})
			}
		})
	}
	else if(req.params.action=== "sales"){
		res.render('admin/sales',{title:"Sales Report"})
	}
	else{
		res.render('index',{title:"Cooper Player"})
	}
})
// SHOW ADD USER FORM
app.get('/add/:action', function(req, res, next){	
	// render to views/user/add.ejs
	
	if(req.params.action==="song"){
	res.render('admin/add', {
		title: 'Add new song',
		action: 'song',
		name: '',
		type: '',
		link: '',
		img:'',
		genre: '',
		artist:''		
	})}
	else{
		res.render('admin/add',{
		title: 'Add new plan',
		action: 'plan',
		name: '',
		price: '',
		duration: '',
		downloads: '',
		quality: '',
		devices: ''
	});
	}
})

// ADD NEW USER POST ACTION
app.post('/add/:action', function(req, res, next){	

	if(req.params.action==="song"){
		var song = {
			name: req.body.name,
			type: req.body.type,
			link: req.body.link,
			img: req.body.img,
			genre: req.body.genre,
			artist: req.body.artist
		}
				 
		req.db.collection('songs').insert(song, function(err, result) {
			if (err) {
				req.flash('error', err)
				res.render('admin/add/song', {
					title: 'Add new song',
					name: song.name,
					type: song.type,
					link: song.link,
					img: song.img,
					genre: song.genre,
					artist: song.artist,				
				})
			} else {				
				req.flash('success', 'Song added successfully!')			
				res.redirect('/admin/song')
			}
		})		
	}
	else{
		var plan = {
			name: req.body.name,
			price: req.body.price,
			duration: req.body.duration,
			downloads: req.body.downloads,
			quality: req.body.quality,
			devices: req.body.devices
		}

		req.db.collection('plans').insert(plan, function(err, result) {
			if (err) {
				req.flash('error', err)
				res.render('admin/add/plan', {
					title: 'Add new plan',
					name: plan.name,
					price: plan.price,
					duration: plan.duration,
					downloads: plan.downloads,
					quality: plan.quality,
					devices: plan.devices				
				})
			} else {				
				req.flash('success', 'Plan added successfully!')			
				res.redirect('/admin/plan')
				
			}
	})
}});
// SHOW EDIT USER FORM
app.get('/edit/(:id)', function(req, res, next){
	var o_id = new ObjectId(req.params.id)
	req.db.collection('songs').find({"_id": o_id}).toArray(function(err, result) {
		if(err) return console.log(err)
	
		if (!result) {
			req.flash('error', 'Song not found with id = ' + req.params.id)
			res.redirect('/admin')
		}
		else { // if user found
			// render to views/admin/edit.ejs template file
			res.render('admin/edit', {
				title: 'Edit Song', 
				//data: rows[0],
			id: result[0]._id,
			name: result[0].name,
            type: result[0].type,
            link: result[0].link,
			img:result[0].img,
			genre: result[0].genre,
			artist: result[0].artist					
			})
		}
	})	
})

// EDIT USER POST ACTION
app.put('/edit/(:id)', function(req, res, next) {

		var song = {
			name: req.body.name,
			type: req.body.type,
			link: req.body.link,
			img:req.body.img,
			genre: req.body.genre,
			artist: req.body.artist
		}
		console.log(song);
		var o_id = new ObjectId(req.params.id)
		req.db.collection('songs').update({"_id": o_id}, song, function(err, result) {
			if (err) {
				req.flash('error', err)
				console.log("failed")
				// render to views/admin/edit.ejs
				res.render('admin/edit', {
					title: 'Edit Song',
					id: req.params.id,
					name: req.body.name,
					type: req.body.type,
					link: req.body.link,
					img:req.body.img,
					genre: req.body.genre,
					artist: req.body.artist,
				})
			} else {
				req.flash('success', 'Song updated successfully!')
				res.redirect('/admin/song')
			}
		})		
})

// DELETE USER
app.delete('/delete/(:id)/:action', function(req, res, next) {	
	var o_id = new ObjectId(req.params.id)
	
	if(req.params.action==="song"){
	
	req.db.collection('songs').remove({"_id": o_id}, function(err, result) {
		if (err) {
			req.flash('error', err)
			// redirect to users list page
			res.redirect('/admin')
		} else {
			req.flash('success', 'Song deleted successfully!')
			// redirect to users list page
			res.redirect('/admin/song')
		}
	})	
}
else{
	req.db.collection('plans').remove({"_id": o_id}, function(err, result) {
		if (err) {
			req.flash('error', err)
			// redirect to users list page
			res.redirect('/admin')
		} else {
			req.flash('success', 'Plan deleted successfully!')
			// redirect to users list page
			res.redirect('/admin/plan')
		}
	})
}})

module.exports = app
