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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate=require('mongoose-findorCreate');


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
  password:String,
  facebookId:String,
  secret:String
});

//plugin using passportlocalmongoose for database
UserSchema.plugin(passportlocalmongoose);
//plugin for findOrCreate method
UserSchema.plugin(findOrCreate);

const User=new mongoose.model("User",UserSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/secrets",
  //  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect("/secrets");
  });

app.get("/auth/facebook",
       passport.authenticate("facebook")
);


app.get("/auth/facebook/secrets",
     passport.authenticate("facebook", { failureRedirect: "/login" }),
     function(req, res) {
       // Successful authentication, redirect secrets.
          res.redirect("/secrets");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  User.find({"secret": {$ne:null}},function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        res.render("secrets", { userWithSecret:foundUser});
      }
    }
  });
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
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

app.post("/submit",function(req,res){
  const submitsecret=req.body.secret;
  console.log(req.user.id);

  User.findById(req.user.id, function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret=submitsecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.listen(3000,function(){
  console.log("Server has started Successfully");
});
