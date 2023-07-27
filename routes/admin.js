const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

const userdb = require("../modals/userSchema");
const topicdb = require("../modals/topicSchema");
const managerdb = require("../modals/managerSchema");
const admindb = require("../modals/adminSchema");
const articledb = require("../modals/articleSchema");
const reviewdb = require("../modals/reviewSchema");





const session = require("express-session");
const { articleSchema } = require('../modals/articleSchema');
const user = userdb.userModel;
const topic = topicdb.topicModel;
const manager = managerdb.managerModel;
const admin = admindb.adminModel;
const article = articledb.articleModel;
const review = reviewdb.reviewModel;



router.use(session({secret: "Session Key", resave: true, saveUninitialized: true}));

router.use(function(req, res, next) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
 });

 router.use(function(req, res, next) {
    res.locals.message = req.session.message;
    res.locals.adminId = req.session.adminId;
    next();
  });

router.get("/login",function(req,res){

    res.render("admin/alogin");

})

router.post("/login",function(req,res){

    var details = req.body;
    
    admin.findOne({email : details.email, password: details.password})
    .then((data)=>{

        req.session.adminId = data._id;
        res.redirect("adashboard");

    }).catch(()=>{
        res.render("admin/alogin",{message: "Invalid Credentals"})
    })
})

function checkSignIn(req,res,next){
    if(req.session.adminId){
       next();}
    else{
        if(!req.session.message){
    req.session.message = "Session Expired, please Log In"; }
    res.redirect("/admin/login");
}
 }


 router.get("/adashboard", checkSignIn, function(req,res){

    user.find().sort({_id: -1})
    .then((data)=>{

    res.render("admin/adashboard",{users: data});

    }).catch((err)=>{console.log(err)})


 })

 router.get("/userda/:id", checkSignIn, function(req,res){

    user.updateOne({_id : req.params.id}, {$set: {status: 0}})
    .then(()=>{
        res.redirect("/admin/adashboard");
    
    }).catch((err)=>{console.log(err);})
 })


 router.get("/usera/:id", checkSignIn, function(req,res){

    user.updateOne({_id : req.params.id}, {$set: {status: 1}})
    .then(()=>{
        res.redirect("/admin/adashboard");
    
    }).catch((err)=>{console.log(err);})
 })

 router.get("/ntopic", checkSignIn, function(req,res){

    topic.find()
    .then(()=>{
    res.render("admin/ntopic");
    })
 })



 router.post("/ntopic", checkSignIn,  function(req,res){
    var details = req.body;

    bcrypt.genSalt(10)
    .then((salt)=>{
        return bcrypt.hash(details.password, salt)
        .then((cryptPass)=>{

        var newManager = new manager({
        name : details.managername,
        email : details.email,
        password: cryptPass,})

    newManager.save()

    .then((newmanager)=>{
        var newTopic = new topic({

            name : details.topicname,
            manager: newmanager._id
        })

        newTopic.save()
        .then((newtopic)=>{

            manager.updateOne({_id : newmanager._id}, {$set: {topic : newtopic._id}})
            .then(()=>{
                res.redirect("/admin/adashboard");

                  }).catch((err)=>{console.log(err);})

               }).catch((err)=>{console.log(err);})

            }).catch((err)=>{console.log(err);})

        }).catch((err)=>{console.log(err);})

    }).catch((err)=>{console.log(err);})
 })

 router.get("/existingM", checkSignIn, function(req,res){

    manager.find().sort({_id : -1})
    .populate({path : "topic"})
    .then((data)=>{
        res.render("admin/existingM", {managers : data});

    }).catch((err)=>{console.log(err);})
 })


 router.get("/managerD/:id", (req,res)=>{

    manager.findOne({_id: req.params.id})
    .then((mdata)=>{
        manager.deleteOne({_id : req.params.id})
        .then(()=>{
            topic.deleteOne({_id : mdata.topic._id})
            .then(()=>{

                article.deleteMany({topic : mdata.topic._id})
                .then(()=>{
                res.redirect("/admin/existingM");
                
                })
            })
        })
    }).catch((err)=>{console.log(err)})
 })

 router.get("/managerE/:id", checkSignIn, (req,res)=>{

    manager.find({_id : req.params.id})
    .populate({path: "topic"})
    .then((mdataejs)=>{
    res.render("admin/managerE", {managerdata: mdataejs})

    }).catch((err)=>{console.log(err)})
 })

 router.post("/managerE/:id", (req,res)=>{

    var id = req.params.id;
    var details = req.body;

    manager.updateMany({_id: id}, {$set: {name: details.managername, 
                                          email: details.email, 
                                          password: details.password}})
   .then(()=>{

    manager.find({_id : id})
    .populate({path : "topic"})
    .then((managerdata)=>{

        topic.UpdateOne({_id : managerdata.topic._id }, {$set : {name : details.topicname}})
        .then(()=>{
            res.redirect("/admin/adashboard")

        }).catch((err)=>{console.log(err)})

    }).catch((err)=>{console.log(err)})

   }).catch((err)=>{console.log(err)})

 })


 router.get("/reset", (req,res)=>{

    res.render("admin/reset", {message:""});
 })

 router.get("/resetaction", checkSignIn, (req,res)=>{

    user.deleteMany({})
    .then(()=>{
        manager.deleteMany({})
        .then(()=>{
            topic.deleteMany({})
            .then(()=>{
                article.deleteMany({})
                .then(()=>{
                    review.deleteMany({})
                    .then(()=>{
                        res.render("admin/reset", {message: "data cleared"});
                    })
                })
            })
        })
    }).catch((err)=>{ console.log(err); })
 })

module.exports = router;
