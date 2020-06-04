//jshint esversion:6
require('dotenv').config();
const express=require('express');
const bodyparser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const saltRounds = 10;
const app=express();


app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine','ejs');

//console.log(process.env.API_KEY);

mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser: true,useUnifiedTopology: true});

const UserSchema=new mongoose.Schema({
  email:String,
  password:String
});


const User=new mongoose.model("User",UserSchema);

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    const newUser=new User({
      email:req.body.username,
      password:hash
    });

    newUser.save(function(err){
      if(err){
        console.log(err);
      }else{
        res.render("secrets");
      }
    });
  });

});

app.post("/login",function(req,res){
  var newemail=req.body.username;
  var password=req.body.password;

  User.findOne({email:newemail},function(err,foundItem){
    if(err){
      console.log(err);
    }else{
      if(foundItem){
        bcrypt.compare(password, foundItem.password, function(err, result) {
          if(result==true){
            res.render("secrets");
          }
        });

      }
    }
  });
});

app.listen(3000,function(){
  console.log("Server has started Successfully");
});
