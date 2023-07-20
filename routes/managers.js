const express = require('express');
const router = express.Router();

const articledb = require("../modals/articleSchema");
const article = articledb.articleModel;

const userdb = require("../modals/userSchema");
const user = userdb.userModel;

const managerdb = require("../modals/managerSchema");
const manager = managerdb.managerModel;

const session = require("express-session");

router.use(session({secret: "Session Key", resave: true, saveUninitialized: true}));

router.use(function(req, res, next) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
 });

 router.use(function(req, res, next) {
    res.locals.manager = req.session.manager;
    res.locals.managerId = req.session.managerId;
    res.locals.message = req.session.message;
    next();
  });


router.get("/login",function(req,res){

    res.render("manager/mlogin")
})

router.post("/login", function(req,res){

    var mdetails = req.body;
    if(mdetails.email && mdetails.password){
    manager.findOne({email : mdetails.email, password: mdetails.password})
    .then((managerdata)=>{
            req.session.manager = managerdata.name;
            req.session.managerId = managerdata._id;
            res.redirect("mdashboard");

        }).catch((err)=>{
            res.render("manager/mlogin",{message: "Invalid Credentials"});
            console.log(err)})
        }
        else{
            console.log("invalid");
        }

})

function checkSignIn(req,res,next){
    if(req.session.manager){
       next();}
    else{
        if(!req.session.message){
    req.session.message = "Session Expired, please Log In"; }
    res.redirect("/managers/login");
}
 }

 router.get("/mdashboard", checkSignIn, function(req,res){

    manager.findOne({_id: req.session.managerId})
    .populate({path: "topic", populate: { path: 'articles'}})
    .then((mdata)=>{
        
        res.render("manager/mdashboard",{topic: mdata.topic});

    }).catch((err)=>{console.log})

 })

 router.get("/approve/:id", checkSignIn, function(req,res){
    var articleId = req.params.id;
    article.updateMany({_id : articleId}, {$set : {approved: "Approved !"}})
    .then(()=>{
        res.redirect("/managers/mdashboard");

    }).catch((err)=>{ console.log(err) });

 })

 router.get("/reject/:id", checkSignIn, function(req,res){
    var articleId = req.params.id;
    article.updateMany({_id : articleId}, {$set : {approved: "Rejected."}})
    .then(()=>{
        res.redirect("/managers/mdashboard");

    }).catch((err)=>{ console.log(err) });

 })

 router.get("/postSort/:sort", checkSignIn, function(req,res){

    manager.findOne({_id: req.session.managerId})
    .populate({path: "topic", populate: { path: 'articles'}})
    .then((mdata)=>{
        
        res.render("manager/postSort",{topic: mdata.topic, sort: req.params.sort});

    }).catch((err)=>{console.log})

 })








module.exports = router;
