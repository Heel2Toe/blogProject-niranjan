const mongoose = require('mongoose');


const managerSchema = new mongoose.Schema({

    name: String,
    email: String,
    password: String,
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'topics' },
    
});

const managerModel = mongoose.model('managers', managerSchema);

module.exports = {managerModel, managerSchema};