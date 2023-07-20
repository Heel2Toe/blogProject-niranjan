const express = require('express');
const router = express.Router();

const userdb = require("../modals/userSchema");
const articledb = require("../modals/articleSchema");
const topicdb = require("../modals/topicSchema");
const reviewdb = require("../modals/reviewSchema");

const session = require("express-session");
const user = userdb.userModel;
const article = articledb.articleModel;
const topic = topicdb.topicModel;
const review = reviewdb.reviewModel;



router.use(session({secret: "Session Key", resave: true, saveUninitialized: true}));

router.use(function(req, res, next) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
 });

 router.use(function(req, res, next) {
    res.locals.message = req.session.message;
    res.locals.user = req.session.user;
    res.locals.userId = req.session.userId;
    res.locals.premium = req.session.premium;
    res.locals.manager = req.session.manager;
    res.locals.managerId = req.session.managerId;
    next();
  });

router.get("/",function(req,res){
 
    article.find({approved: "Approved !"})
    .populate({path: "topic"})
    .populate({path: "user"})
    .then(function(articles){
        res.render("home/home",{articles});
    })
    .catch(function(err){
        console.log(err)})
})

router.get("/login",function(req,res){

    const message = req.session.message;
    req.session.message = "";
    res.render("home/login",{message});
})

router.post("/login", function(req, res) {
    var udetails = req.body;

    if (!udetails.email || !udetails.password) {
        res.render("home/login", { message: "Enter all details to proceed" });
    } else {
        user.findOne({ email: udetails.email, password: udetails.password })
            .then(function(userdata) {
                if (userdata) {
                    if (userdata.status == 0) {
                        res.render("home/login", { message: "Account currently deactivated" });
                    } 
                    else if(userdata.premium == 0 && userdata.stars >= 10){
                    
                        user.updateOne({_id: userdata._id},{$set: {premium: 1}})
                        .then(()=>{ 
                            req.session.premium = "Premium";
                            req.session.user = userdata.name;
                            req.session.userId =userdata._id;
                            res.redirect("/premium");
    
                        }).catch((err)=> console.log(err)) 
                    } 
                      else if(userdata.premium == 1){
                        req.session.premium = "Premium";
                        req.session.user = userdata.name;
                        req.session.userId =userdata._id;
                        res.redirect("/dashboard");
                      }
                        else if(userdata.premium == 0 && userdata.stars < 10){

                            req.session.user = userdata.name;
                            req.session.userId =userdata._id;
                            res.redirect("/dashboard");
                        }
                        
                    }else{
                        res.render("home/login", { message: "Invalid credentials." });
                    }
                }).catch(()=>{
                    res.render("home/login", { message: "Invalid credentials." }); })
            }
});


router.get("/register",function(req,res){

    res.render("home/register");
});

router.post("/register", function (req, res) {
    var udetails = req.body;

    if (!udetails.name || !udetails.email || !udetails.password) {
        res.render("home/register", { message: "Enter all details to register" });
    } else {

        user.findOne({ $or: [{ name: udetails.name }, { email: udetails.email }] })
            .then(function (existingUser) {

                if (existingUser) {
                    res.render("home/register", { message: "Username or email already in use." });
                } 
                
                else {
                    var newUser = new user({
                        name: udetails.name,
                        email: udetails.email,
                        password: udetails.password,
                        status: 1,
                        stars: 0,
                        premium: 0,
                    })
                    newUser.save()
                        .then(function () {
                            user.find({name: udetails.name})
                            .then(function(userdata){
                              req.session.userId =userdata._id;
                              req.session.user = userdata.name;
                              res.redirect("/dashboard");
                            })
                            .catch(function(err){
                                res.send(err);
                            });
                        })
                        .catch(function (err) {
                            res.send(err);
                          });
                }
         })
        .catch(function (err) {
        res.send(err);
     });
  }
});
 

function checkSignIn(req,res,next){
    if(req.session.user || req.session.manager){
       next();}
    else{
        if(!req.session.message){
    req.session.message = "Session Expired, please Log In"; }
    res.redirect("/login");
}
 }

 router.get("/dashboard",checkSignIn, function(req,res){
    const userid = req.session.userId;

    user.findById(userid)
  .populate({path: 'articles',
   populate: {
      path: 'topic',
      model: 'topics'
    }
  })
  .then(function(user) {
    // const premium = req.session.premium;
     res.render("user/dashboard", { articles: user.articles});
  })
  .catch(function(err) {
    res.send(err);
  });
}) 


router.get("/compose", checkSignIn, function(req,res){
    topic.find()
    .then(function(topics){
        const message = req.session.message;
        req.session.message = ""
        res.render("user/compose",{topics,message}); 
    })
})


router.post("/compose", function(req,res){

var adetails = req.body;
if(!adetails.topic || !adetails.title || !adetails.content){
    if(!req.session.message){
   req.session.message = "Enter all details to proceed"}
    res.redirect("/compose");
}
else{

    user.find({name: req.session.user})
    .then(function(userdata){

      var creator = userdata[0]._id;

      var newArticle = new article({

        title: adetails.title,
        content: adetails.content,
        topic: adetails.topic,
        articleDate: Date.now(),
        user: creator,
        approved: "Approval Pending",
        rating: 0
        });

        newArticle.save()
        .then(function(){
            user.updateMany({_id : creator}, { $push: { articles : newArticle._id} })
            .then(function(){
                topic.updateMany({_id : adetails.topic}, {$push: {articles : newArticle._id}})
                .then(function(){
                console.log("user db updated");
                res.redirect("/dashboard"); 
                })
               .catch(function(err){console.log(err)})
        })
        .catch(function(err){ console.log(err)})
    })
    .catch(function(err){ console.log(err) })
   })
    .catch(function(err){ console.log(err)})
  }
});

router.get("/premium", checkSignIn, function(req,res){
    res.render("user/premium");
})


router.get("/discover", checkSignIn, function(req,res){

    article.find({ approved: "Approved !", user: { $ne: req.session.userId } })
    .populate({path: "topic"})
    .populate({path: "user"})
    .then(function(articles){
        res.render("user/discover",{articles});
    })
    .catch(function(err){
        console.log(err)})
})

router.get("/homePosts/:id", function(req, res) {
    var articleId = req.params.id;
    article.findById(articleId)
        .populate({ path: 'user' })
        .populate({ path: 'topic' })
        .populate({ path: 'reviews',populate: { path: 'user' } })
        .then(function(articleData) {
            res.render("posts", { article: articleData });
        })
        .catch(function(err) {
            res.send(err);
        });
});


router.get("/posts/:id", function(req, res) {
    var articleId = req.params.id;
    article.findById(articleId)
        .populate({ path: 'user' })
        .populate({ path: 'topic' })
        .populate({ path: 'reviews',populate: { path: 'user' } })
        .then(function(articleData) {
            res.render("posts", { article: articleData });
        })
        .catch(function(err) {
            res.send(err);
        });
});


router.get("/review/:id",checkSignIn, function(req,res){

    res.render("user/review");
})

router.post("/review/:id", function(req,res){

    var rdetails = req.body;

    var newReview = new review({
        rating : rdetails.rating,
        comment : rdetails.comment,
        article : req.params.id,
        user : req.session.userId
    })
    newReview.save()
    .then(() => {
    user.updateOne({ _id: req.session.userId }, { $push: { reviews: newReview._id } })
        .then(() => {
         article.updateOne({ _id: req.params.id }, { $push: { reviews: newReview._id } })
            .then(() => {
                article.findById(req.params.id)
                    .populate('user')
                        .then((articleData) => {
                            const articleUser = articleData.user;
                            user.updateOne({ _id: articleUser._id }, { $inc: { stars: newReview.rating } })
                            .then(() => {
                            res.redirect("/posts/" + req.params.id);
                            })
                            .catch((err) => { console.log(err) });
                            })
                            .catch((err) => { console.log(err) });
                    })
                    .catch((err) => { console.log(err) });
            })
            .catch((err) => { console.log(err) });
    })
    .catch((err) => { console.log(err); });
});

router.get("/reviewDelete/:id",function(req,res){

    var reviewId = req.params.id;

    review.findById(reviewId)
    .populate({path: "user"})
    .populate({path: "article"})
    .then((review)=>{
        user.findByIdAndUpdate(req.session.userId, { $pull: {reviews: review._id } })
        .then(()=>{
            article.findByIdAndUpdate(review.article._id, { $pull: {reviews: review._id } })
            .then(()=>{
                res.redirect("/posts/"+ review.article._id);
            })
            .catch((err)=>{console.log(err);})

        }).catch((err)=>{console.log(err);})

    }).catch((err)=>{console.log(err);})
})


router.get("/delete/:id", function(req, res) {

    const articleId = req.params.id;

    article.findById(articleId)

        .then(function(article) {
                article.deleteOne({ _id: articleId })

                    .then(function() {
                        user.findByIdAndUpdate(req.session.userId, { $pull: { articles: articleId, reviews: article.reviews } })
    
                        .then(function() {
                            review.deleteMany({ _id: { $in: article.reviews } })

                                .then(function() {
                                    res.redirect("/dashboard");
                                })
                                .catch(function(err) {
                                    console.log(err);
                                });
                        })
                        .catch(function(err) {
                            console.log(err);                        
                        });
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            
        })
        .catch(function(err) {
            res.redirect("/dashboard");
        });
});


router.get("/logout", function(req,res){
        req.session.destroy(function(){
           console.log("one user logged out" + "\n");
        })
        res.redirect("/");
     });


module.exports = router;