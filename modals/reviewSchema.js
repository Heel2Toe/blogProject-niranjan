const mongoose = require('mongoose');


const reviewSchema = new mongoose.Schema({

    rating: Number,
    comment: String,
    article: {type : mongoose.Schema.Types.ObjectId, ref: 'articles'},
    user: {type : mongoose.Schema.Types.ObjectId, ref: 'users'}
    
});

const reviewModel = mongoose.model('reviews', reviewSchema);

module.exports = {reviewModel, reviewSchema};