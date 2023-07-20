const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({

    name: String, 
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'articles' }],
    manager: {type: mongoose.Schema.Types.ObjectId, ref: 'managers'}

})

const topicModel = mongoose.model("topics", topicSchema);

module.exports = {topicSchema, topicModel};
