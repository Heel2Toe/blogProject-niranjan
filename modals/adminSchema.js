const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({
    email: String,
    password: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    managers: [{type: mongoose.Schema.Types.ObjectId, ref: "managers"}],

});

const adminModel = mongoose.model('admins', adminSchema);

module.exports = {adminSchema, adminModel};