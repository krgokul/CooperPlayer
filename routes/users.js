var express = require('express')
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var LocalStrategy = require('passport-local').Strategy;
var app = express()
var ObjectId = require('mongodb').ObjectId;
app.use(session({
	secret: "Our little secret.",
	resave: false,
	saveUninitialized: false,
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true});
//userschema
  const userSchema = new mongoose.Schema ({
	name: {
		type: String,	
	},
	email: {
		type: String,	
	},
	password: {
		type: String,
	},
	plan:{
		type:String,
		default:""
	},
	callertune: {
		type :String,
		default:""
	},
	roles: {
		type:Number,
		default:1
	},
	playlist:{ type:Array , default:[] }
  });
//comments
const commentSchema = new mongoose.Schema({
	user_id: "",
	comment: ""
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User",userSchema);
const Comment = new mongoose.model("Comment",commentSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get('/home',(req,res)=>{
	res.render('user/home',{title:"Home"});
})
app.get('/login', function(req, res){
	res.render("user/login",{title:"Login"});
  });
app.get('/register', function(req, res){
	res.render("user/register",{title:"Register"	
	});
});

app.get('/:id',(req,res) => {
   	if(req.isAuthenticated()) {
		User.findById(req.params.id,(err,results)=>{ 
				if(results.name != "admin" ){
				req.db.collection('songs').find().sort({"_id": -1}).toArray(function(err, result) {
					if(err) return console.log(err)
					res.render('user/songList',{title:"Play Songs",data:result,u_id:req.params.id,role:results.roles})
				})}
			else res.render('index',{title:"Cooper PLayer"})
		})	
	}
	else
	res.redirect('login');
})
app.get('/playlists/:id',(req,res)=>{
	User.findOne({"_id":req.params.id},function(err, result) {
		if(err) console.log(err)
		else {
			res.render('user/playlist',{title:"Playlist",u_id:req.params.id,data:result.playlists});
		}
	})
})
app.get('/view_playlist/:id',(req,res)=>{
	User.findOne({"_id":req.params.id},function(err,result){
		if(err) console.log(err)
		else{
			res.render('user/viewlist',{title:"View PlayList",u_id:req.params.id,data:result.playlist})
		}
	})
	
})
app.get('/upgrade/:id', (req,res) => {
	req.db.collection('plans').find().sort({"price": 1}).toArray(function(err, result) {
		// render to views/user/list.ejs template file
		res.render('user/plans', {
			title: 'PRO Plans', 
			data: result,
			u_id:req.params.id	
		})
})
})
app.get('/query/:id',(req,res)=>{
	res.render('user/query',{title:"Query",u_id:req.params.id})
})
//playlist and song array
app.get('/all_list/:id/:playlist_name',function(req,res){
	var dat = [];
	req.db.collection('songs').find().sort({"_id": 1}).toArray(function(err, result){
		dat = result
		User.findOne({"playlist":{$elemMatch:{"name":req.params.playlist_name} }},function(err, result) {
			res.render('user/all_list',{
				title:"All_list",
				u_id:req.params.id,
				data:result.playlist,
				playlist_name:req.params.playlist_name,
				songslist : dat
			})
		})
	})
	}) ; 

	
//songs info
app.get('/addsongs/:id/:playlist_name',function(req,res){
	req.db.collection('songs').find().sort({"_id": 1}).toArray(function(err, result) {
		if(err) return console.log(err)
		User.find({"_id":req.params.id},function(err,val){
			if(val[0].roles == 1){
				var dat = result.filter((e) => e.type === "Normal")
				res.render('user/addsongs',{title:"Add_Songs",data:dat,u_id:req.params.id,playlist_name:req.params.playlist_name})
			}else{
				res.render('user/addsongs',{title:"Add_Songs",data:result,u_id:req.params.id,playlist_name:req.params.playlist_name})
			}
		})	
	})
})

app.get('/addtoplaylist/:name/:song_name/:u_id',(req,res)=>{
		User.findOne({"_id":req.params.u_id},function(err,arr){
			var result = arr.playlist.find(function(e) {
				return e.name == req.params.name;
			  });
			  if(!result.songs.includes(req.params.song_name) ){
				User.updateOne({"_id":req.params.u_id,"playlist.name":req.params.name},
				{$push:{"playlist.$.songs":req.params.song_name}},function(){
					res.redirect('/users/addsongs/'+req.params.u_id+'/'+req.params.name)	
				})
			  }else{
				  res.redirect('/users/addsongs/'+req.params.u_id+'/'+req.params.name)
			  }
		})		
})

	app.post('/register', function(req, res){
	var users = new User({name: req.body.name,email:req.body.username,username:req.body.username})
	User.register(users , req.body.password, function(err, user){
		if (err) {
		  res.redirect('/users/register');
		} else {
		passport.authenticate("local")(req, res, function(){
			res.redirect('/users/login');
		})
		}
	  });
  });
  app.post('/login', function(req, res){
	const record = new User({
	  username: req.body.username,
	  password: req.body.password
	});
	User.findOne({"username":req.body.username}, function(err,result){
		id = result._id
	}); 
	req.login(record, function(err){
	  if (err) {
		console.log(err);
	  } else {
		passport.authenticate("local")(req, res, function(){
		  res.redirect('/users/'+id);
		});
	  }
	});
  });	
app.post('/upgrade/:id',function(req,res){ 
	const u_id = req.params.id;
	const plan_id = req.body.plan;
	User.updateOne({"_id":req.params.id},{$set:{"plan":plan_id,"roles":2}}).then(function () {
			return res.status(200).send({result: 'redirect', url:'/users/'+u_id})
	}).catch(function(){
			return res.status(401).send({error: "Something is wrong."})
	})
})
app.post('/create/:id',function(req,res){
	const record = {
		name: req.body.play_name,
		songs:[]
	}
	User.updateOne({"_id":req.params.id},{$push:{ "playlist" : [record] }}).then(()=>{
		res.redirect('/users/view_playlist/'+req.params.id)
	})
})
app.delete('/delete_list/:id/:playlist_name',(req,res)=>{
	User.updateOne({"_id":req.params.id},{$pull : {"playlist" : {"name":req.params.playlist_name} } } ).then( () => {
		res.redirect('/users/view_playlist/'+req.params.id)
	})
})

app.post('/deletefromplaylist/:name/:song_name/:u_id',(req,res)=>{
	User.updateOne({"_id":req.params.u_id,"playlist.name":req.params.name},
	{$pull:{"playlist.$.songs":req.params.song_name}},function(){
		res.redirect('/users/all_list/'+req.params.u_id+'/'+req.params.name)	
	})
})
app.post('/query/:id',(req,res)=>{
 const record = {
	user_id:req.params.id,
	comment:req.body.comment_text
 }
	Comment.insertMany(record, function(err,result){
			req.flash('success', 'Comment added successfully!')		
			console.log(result)	
			res.redirect('/users/query/'+ req.params.id)
	})
})

module.exports = app