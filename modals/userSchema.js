const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: String,
    email: String,
    password: String,
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'articles' }],
    status: Number,
    stars: Number,
    premium: Number,
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'reviews' }]
    
});

const userModel= mongoose.model('users', userSchema);

module.exports = {userSchema,userModel};