const mongoose = require('mongoose');


const articleSchema = new mongoose.Schema({
    title: String,
    content: String,
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'topics' },
    articleDate: Date,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    reviews: [{type: mongoose.Schema.Types.ObjectId, ref: "reviews"}],
    approved: String
});

const articleModel = mongoose.model('articles', articleSchema);

module.exports = {articleSchema, articleModel};