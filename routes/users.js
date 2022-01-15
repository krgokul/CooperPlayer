var express = require('express')
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var LocalStrategy = require('passport-local').Strategy;
var app = express()
var ObjectId = require('mongodb').ObjectId;
var currentdate = new Date(); 
var datetime =  currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
app.use(session({
	secret: "Our little secret.",
	resave: false,
	saveUninitialized: false,
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true});

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
		expires:1000,
		type :String,
		default:""
	},
	roles: {
		type:Number,
		default:1
	},
	playlist:{ type:Array , default:[] },
	history:{type:Array , default: []}
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
					res.render('user/songList',{title:"Play Songs",data:result,u_id:req.params.id,role:results.roles,name:results.name})
				})}
			else res.render('index',{title:"Cooper Player"})
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
})

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
	
	app.get('/addcallertune_to_user/:id/:song_name',(req,res)=>{
		User.findById({"_id": req.params.id},(err,result) => {
		const song_name = req.params.song_name;
		var activity = {"Type":"Caller Tune","Date":datetime};
		var temp = result.history.filter(e=>e.Type === "Caller Tune").length; 
		if(result.history.length === 0){
			activity["Id"] =1;
			activity["Description"] = "Added Caller tune - " + song_name;
		}else {
			if(temp === 0){
				activity["Id"] = result.history.length + 1;
				activity["Description"] = "Added Caller tune - " + song_name;
			}else{
				activity["Id"] = result.history.length + 1;
				activity["Description"] = "Updated Caller tune - " + song_name;
			}
		}
		User.updateOne({"_id":req.params.id},{$set:{"callertune":req.params.song_name},$push:{"history":activity}},function(){
				res.redirect('/users/callertune/'+req.params.id)
		})		
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
  app.get('/callertune/:id',function(req,res){
	User.findById(req.params.id,(err,result)=>{ 
		if(result.callertune === ""){
			res.render('user/callertune',{title:'Caller Tune',u_id:req.params.id,tune:result.callertune})
		}else{
			req.db.collection('songs').find({"name":result.callertune}).toArray(function(err, song) {
				res.render('user/callertune',{title:'Caller Tune',u_id:req.params.id,tune:result.callertune,record:song[0]})	
			})
		}})
	  })

app.get('/addcallertune/:id',(req,res)=>{
	req.db.collection('songs').find().sort({"_id": 1}).toArray(function(err, result) {
		if(err)  return console.log(err)
		else res.render('user/addcallertune',{title:"Add caller tune",data:result,u_id:req.params.id})
	})
  })

app.get('/history/:id',(req,res)=>{
	User.findById(req.params.id,(err,result)=>{
		if(err) console.log(err)
		else res.render('user/history',{title:"History",u_id:req.params.id,data:result.history})
	})
})

  app.post('/upgrade/:id',function(req,res){ 
	User.findById({"_id": req.params.id},(err,result) => {
		const u_id = req.params.id;
		const plan_name = req.body.name;
		var temp = result.history.filter(e=>e.Type === "Plan").length; 
		var activity = {"Type":"Plan","Date":datetime};
		if(result.history.length === 0){
			activity["Id"] =1;
			activity["Description"] = "Added Plan - " + plan_name;
		}else {
			if(temp === 0){
				activity["Id"] = result.history.length + 1;
				activity["Description"] = "Added Plan - " + plan_name;
			}else{
				activity["Id"] = result.history.length + 1;
				activity["Description"] = "Updated Plan - " + plan_name;
			}
		}
	User.updateOne({"_id":req.params.id},{$set:{"plan":plan_name,"roles":2},$push:{"history":activity}}).then(function () {	
			return res.status(200).send({result: 'redirect', url:'/users/'+u_id})
	}).catch(function(){
			return res.status(401).send({error: "Something is wrong."})
	})
	})
})
app.post('/create/:id',function(req,res){
	User.findById({"_id": req.params.id},(err,result) => {
	const record = {
		name: req.body.play_name,
		songs:[]
	}
	var activity = {"Type":"Playlist","Date":datetime};
		var temp = result.history.filter(e=>e.Type === "Playlist").length; 
		if(result.history.length === 0){
			activity["Id"] = 1;
			activity["Description"] = "Added Playlist - " + req.body.play_name;
		}else {
			if(temp === 0){
				activity["Id"] = result.history.length + 1;
				activity["Description"] = "Added Playlist - " + req.body.play_name;
			}else{
				activity["Id"] = result.history.length + 1;
				activity["Description"] = "Added Playlist - " + req.body.play_name;
			}
		}
	User.updateOne({"_id":req.params.id},{$push:{ "playlist" : [record],"history":activity }}).then(()=>{
		res.redirect('/users/view_playlist/'+req.params.id)
	})
  })
})
app.delete('/delete_list/:id/:playlist_name',(req,res)=>{
	User.findById({"_id": req.params.id},(err,result) => {
		var cur = result.history;
		var activity = {"Type":"Playlist","Date":datetime,"Id":cur.length+1,"Description":"Deleted Playlist - "+req.params.playlist_name};
		var temp = result.history.filter(e=>e.Type === "Playlist").length; 
	User.updateOne({"_id":req.params.id},{$pull : {"playlist" : {"name":req.params.playlist_name} },$push:{"history":activity} } ).then( () => {
		res.redirect('/users/view_playlist/'+req.params.id)
	})
	})
})

app.get('/deletefromplaylist/:name/:song_name/:u_id',(req,res)=>{
	User.findById({"_id": req.params.id},(err,result) => {
	User.updateOne({"_id":req.params.u_id,"playlist.name":req.params.name},
	{$pull:{"playlist.$.songs":req.params.song_name}},function(){
		res.redirect('/users/all_list/'+req.params.u_id+'/'+req.params.name)	
	})
	})
})
app.post('/query/:id',(req,res)=>{
 const record = {
	user_id:req.params.id,
	comment:req.body.comment_text
 }
	Comment.insertMany(record, function(err,result){
			req.flash('success', 'Comment added successfully!')		
			res.redirect('/users/query/'+ req.params.id)
	})
})

module.exports= { app,Comment,User }