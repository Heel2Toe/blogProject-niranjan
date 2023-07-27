const express = require('express');
const bcrypt = require('bcrypt');

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

    res.locals.adminId = req.session.adminId;
    
    next();
  });

router.get("/",function(req,res){
 
    article.find({approved: "Approved !"}).sort({articleDate: -1})
    .populate({path: "topic"})
    .populate({path: "user"})
    .then(function(articles){
        res.render("home/home",{articles});
    })
    .catch(function(err){
        console.log(err)})
})

router.get("/about", function(req,res){

    res.render("home/about");
})




router.get("/login",function(req,res){

    const message = req.session.message;
    req.session.message = "";
    res.render("home/login",{message});
})



router.post("/login", function(req, res) {

    var udetails = req.body;

    if(udetails.email && udetails.password) {
        user.findOne({ email: udetails.email })
            .then(async function(userdata) {
                if (userdata) {
                
                    const passwordValid = await bcrypt.compare(udetails.password, userdata.password);

                    if (!passwordValid) {
                        res.render("home/login", { message: "Invalid credentials." });
                        return;
                    }

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
            })
            .catch(()=>{
                res.render("home/login", { message: "Invalid credentials." });
            });
    }
});





router.get("/register",function(req,res){

    res.render("home/register");
});




router.post("/register", (req, res) => {
    var udetails = req.body;

    if(udetails.name && udetails.email && udetails.password) {

        user.findOne({ $or: [{ name: udetails.name }, { email: udetails.email }] })
        .then((existingUser) => {

            if (existingUser) {
                res.render("home/register", { message: "Username or email already in use." });
            } 
            else {
                bcrypt.genSalt(10)
                .then((salt) => {
                    return bcrypt.hash(udetails.password, salt);
                })
                .then((cryptPass) => {

                    var newUser = new user({
                        name: udetails.name,
                        email: udetails.email,
                        password: cryptPass,
                        status: 1,
                        stars: 0,
                        premium: 0,
                    });

                    return newUser.save();
                })
                .then((newUser) => {
                    req.session.user = newUser.name;
                    req.session.userId = newUser._id;
                    res.redirect("/dashboard");
                })
                .catch((err) => {
                    res.send(err);
                });
            }
        })
        .catch((err) => {
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
    .populate({ path: "articles",options:{sort:{articleDate: -1}}, 
     populate: { path: "topic",}
    })
  .then(function(user)

   {
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

router.get("/pcounter", checkSignIn, function(req,res){
    
    user.findById(req.session.userId)
    .then(function (userdata){
        var counter = 10 - userdata.stars;
        res.render("user/pcounter",{counter});
    })
    
})


router.get("/discover", checkSignIn, function(req,res){

    article.find({ approved: "Approved !", user: { $ne: req.session.userId } }).sort({articleDate: -1})
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




router.get("/posts/:id", checkSignIn, function(req, res) {
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



router.get("/delete/:id", function(req, res) {

    const articleId = req.params.id;

    article.findById(articleId)

        .then(function(article) {
                article.deleteOne({ _id: articleId })

                    .then(function() {
                        user.findByIdAndUpdate(req.session.userId, { $pull: { articles: articleId, reviews: article.reviews } })
    
                        .then(function() {
                            review.deleteMany({ _id: { $in: article.reviews } })

                            .then(function(){
                              topic.findByIdAndUpdate(article.topic, { $pull: { articles: articleId} })
                            

                                .then(function() {
                                    res.redirect("/dashboard");


                                }).catch(function(err) {console.log(err);});

                            }).catch(function(err) {console.log(err);});

                         }).catch(function(err) {console.log(err);});

                    }).catch(function(err) {console.log(err);});
                             
                }).catch(function(err) {console.log(err);});
                        
        });

         




router.get("/edit/:id", checkSignIn, function(req,res){

    article.findById(req.params.id)
    .then((articledata)=>{
        res.render("user/articleEdit",{article : articledata})
    })
})

router.post("/edit/:id", function(req,res){

    var articleId = req.params.id;
    var adetails = req.body;

    article.updateOne({_id : articleId}, {$set: {title: adetails.title, 
                                                content: adetails.content, 
    }})
       .then(()=>{
        res.redirect("/posts/"+articleId);

    }).catch((err) => { console.log(err); });
})




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
                review.deleteOne({_id: reviewId})
                .then(()=>{
                res.redirect("/posts/"+ review.article._id);
                })
                .catch((err)=>{console.log(err);})       
            })
            .catch((err)=>{console.log(err);})

        }).catch((err)=>{console.log(err);})

    }).catch((err)=>{console.log(err);})
})




router.get("/reviewEdit/:id", checkSignIn, function(req,res){

review.findById(req.params.id)
.then((reviewdata)=>{
  res.render("user/reviewEdit", {review : reviewdata});

  }).catch((err)=>{console.log(err);})
})




router.post("/reviewEdit/:id",function(req,res){

    var reviewId = req.params.id;
    var rdetails = req.body;

    review.updateOne({_id: reviewId}, {$set: {comment: rdetails.comment, rating: rdetails.rating}})
    .then(()=>{
        review.findById(reviewId)
        .populate({path: "article"})
        .then((rdata)=>{
        res.redirect("/posts/"+rdata.article._id);

        }).catch((err)=>{console.log(err);})

    }).catch((err)=>{console.log(err);})

})

router.get("/logout", function(req,res){
        req.session.destroy(function(){
           console.log("one user logged out" + "\n");
        })
        res.redirect("/");
     });


module.exports = router;