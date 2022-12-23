require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
//******************************************************************************************************************//

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
//******************************************************************************************************************//
const app = express();
//******************************************************************************************************************//
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended:true}));
app.use(session({
  secret:"my little secret dont tell bro",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
//******************************************************************************************************************//
const password = encodeURIComponent("Gtalebron@23")
const uri = `mongodb+srv://bamMongo23:${password}@cluster0.wvbvubq.mongodb.net/blogWebsiteDB`;
mongoose.connect(uri, { useNewUrlParser: true})
//******************************************************************************************************************//
const userSchema = new mongoose.Schema({
  username:{
    type:String
  },
  password:{
    type:String
  },
  googleId:{
    type:String
  },
  posts:[
    {
    postTitle: String,
    postText: String
    }
  ]
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//******************************************************************************************************************//
const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user,done){
  done(null,user.id)
});
passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(err,user);
  });
});
//******************************************************************************************************************//
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id,username:profile._json.email}, function (err, user) {
      return cb(err, user);
    });
  }
));
//******************************************************************************************************************//
app.get("/", function(req,res){
  res.render("welcome")
})
//******************************************************************************************************************//
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);
//******************************************************************************************************************//
app.get("/auth/google/home",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/home");
});

//******************************************************************************************************************//
app.get("/login",function(req,res){
  res.render("login")
})
//******************************************************************************************************************//
app.get("/logout", function(req,res){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    res.redirect("/")
  });
})
//******************************************************************************************************************//
app.get("/register",function(req,res){
  res.render("register")
})
//******************************************************************************************************************//
app.get("/home",function(req,res){
  if(req.isAuthenticated()){
    User.find({"posts":{$ne:null}},function(err,foundUsers){
      if(!err){
          res.render("home",{info:homeStartingContent,users:foundUsers});
      }
      else{
        console.log("err");
      }
    })
  }
  else{
    res.redirect("/login")
  }
})
//******************************************************************************************************************//
app.get("/compose",function(req,res){
  if(req.isAuthenticated()){
    res.render("compose")
  }
  else{
    res.redirect("/login")
  }
})
//******************************************************************************************************************//
app.get("/about",function(req,res){
  res.render("about",{aboutUs:aboutContent})
})
app.get("/contact",function(req,res){
  res.render("contact",{contactUs:contactContent})
})
//******************************************************************************************************************//
app.post("/register",function(req,res){
  const newUser = new User({
    username:req.body.username,
  })
  User.register(newUser,req.body.password, function(err,results){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/home")
      })
    }
  })
});
//******************************************************************************************************************//
app.post("/login",function(req,res){
  const userName = req.body.userName;
  const passWord = req.body.password;

  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user,function(err){
    if(!err){
      passport.authenticate("local")(req,res,function(){
        res.redirect("/home")
      })
    }
    else{
      res.send(err)
    }
  })
})
//******************************************************************************************************************//
app.post("/compose",function(req,res){

  const postHeader = req.body.composeTitle;
  const postContent = req.body.composeText;
  const name = req.body.name;

  User.findById(req.user.id,function(err,foundUser){
    if(!err){
      console.log(foundUser);
      foundUser.posts.push({
        postTitle:postHeader,
        postText:postContent
      })
      foundUser.save(function(){
        User.find({"post":{$ne:null}},function(err,foundUsers){
          if(!err){
              res.render("home",{info:homeStartingContent,users:foundUsers});
          }
          else{
            console.log(err);
          }
        })
      })
    }
    else{
      console.log(err);
    }
  })
})
//******************************************************************************************************************//
app.get("/post/:postId",function(req,res){

  User.find(function(err,users){
    users.forEach(function(user){
      user.posts.forEach(function(post){
        if(post._id.equals(req.params.postId)){
          res.render("post",{post:post})
        }
      })
    })
  })
})

//******************************************************************************************************************//
app.listen(3000,function(req,res){
  console.log("Server is up and running");
})
//******************************************************************************************************************//
