const   mongoose = require('mongoose'),
        passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    password: String,
    firstName: String,
    lastName: String,
    isActive: {
        type: Boolean,
        default: false
    },
    activateAccountToken: String,
    activateAccountExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);