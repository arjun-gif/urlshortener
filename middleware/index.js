const User = require('../models/users');

//* Middleware Object contains all the middleware as key value pairs
const middlewareObject = {};

middlewareObject.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error','Please Login to continue!');
    res.redirect('/user/login');
};

middlewareObject.isActive = async (req, res, next) => {
    const username = req.body.username;
    const check = await User.findOne({username});
    if(check.isActive){
        return next();
    }
    req.flash('error','Please Activate your account to continue!');
    res.redirect('/');
}

module.exports = middlewareObject;