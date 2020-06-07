//jshint esversion:6
require('dotenv').config();
const express=require('express');
const bodyparser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
const app=express();
const session = require('express-session');
const passport=require('passport');
const passportlocalmongoose=require('passport-local-mongoose');


app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine','ejs');

app.use(session({
  secret: 'Our little secret',
  resave: false,
  saveUninitialized: false,
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser: true,useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);

const UserSchema=new mongoose.Schema({
  email:String,
  password:String
});

//plugin using passportlocalmongoose for database
UserSchema.plugin(passportlocalmongoose);

const User=new mongoose.model("User",UserSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/register",function(req,res){

  User.register({username:req.body.username}, req.body.password,function(err,founduser){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login",function(req,res){
  const user=new User({
    username:req.body.username,
    pasword:req.body.Password
  });

  //this login method is provided by passport
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    });
    }
  });

});

app.listen(3000,function(){
  console.log("Server has started Successfully");
});
