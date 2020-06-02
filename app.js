//jshint esversion:6
require('dotenv').config();
const express=require('express');
const bodyparser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
const encrypt=require('mongoose-encryption');
const app=express();

app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine','ejs');

console.log(process.env.API_KEY);

mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser: true,useUnifiedTopology: true});

const UserSchema=new mongoose.Schema({
  email:String,
  password:String
});


UserSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"] });

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
  const newUser=new User({
    email:req.body.username,
    password:req.body.password
  });

  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets");
    }
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
        if(foundItem.password==password){
          res.render("secrets");
        }
      }
    }
  });
});

app.listen(3000,function(){
  console.log("Server has started Successfully");
});
