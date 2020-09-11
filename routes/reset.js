const   express     = require('express'),
        router      = express.Router(),
        nodemailer  = require('nodemailer'),
        async       = require('async'),
        crypto      = require('crypto'),
        User        = require('../models/users');

//*Routes
router.get('/forgot', (req, res) => {
    res.render('reset/forgot');
})

router.post('/forgot', (req, res, next) => {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            var username = req.body.username;
            User.findOne({ username })
                .then((user) => {
                    if (!user) {
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/reset/forgot');
                    }
                    // setting reset token to the user 
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    user.save((err) => {
                        done(err, token, user);
                    });
                })
                .catch((err) => {
                    req.flash('error', 'No account with that email address exists.');
                    // console.log('ERROR WHILE FINDING USER WITH THAT EMAIL' + username)
                    done(err, token, user);
                    return
                })
        },
        function(token, user, done) {
            // reset password email sender's email details
            var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
                user: process.env.GMAIL,
                pass: process.env.GMAILPASSWORD
            }
            });
            // reset password email content
            var mailOptions = {
            to: user.username,
            from: process.env.GMAIL,
            subject: 'Password Reset',
            text: 'You are receiving this because you (or someone else) have requested a reset for the password of your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            // sending the password reset email
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
                done(err, 'done');
            });
        }
    // callback error handling function
    ], function(err) {
        if (err) return next(err);
        // if no error, then 
        res.redirect('/');
    });
});

router.get('/:token', (req, res) => {
    var tokenProvided = req.params.token;
    User.findOne({ resetPasswordToken: tokenProvided, resetPasswordExpires: { $gt: Date.now() }})
        .then((user) => {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/reset/forgot');
            }
            res.render('reset/reset', {token: tokenProvided});
        })
        .catch((err) => {
            req.flash('error','Something went wrong, Please try again!');
            res.redirect('back');
        })
});

router.post('/:token', function(req, res) {
    var tokenProvided = req.params.token;
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: tokenProvided, resetPasswordExpires: { $gt: Date.now() }})
                .then((user) => {
                    if (!user) {
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.render('404');
                    }
                    if(req.body.password === req.body.confirm) {
                        user.setPassword(req.body.password)
                            .then(() => {
                                user.resetPasswordToken = undefined;
                                user.resetPasswordExpires = undefined;
                                user.save()
                                    .then(() => {
                                        req.logIn(user, function(err) {
                                            done(err, user);
                                        })
                                    })
                                    .catch((err) => {
                                        req.flash('error', 'OOPS! Something went wrong...');
                                        console.log('ERROR WHILE REMOVING TOKEN FROM USER MODEL')
                                        done(err, token, user);
                                        return
                                    })
                            })
                            .catch((err) => {
                                req.flash('error', 'OOPS! Something went wrong...');
                                console.log('ERROR WHILE SETTING NEW PASSWORD TO USER MODEL')
                                done(err, token, user);
                                return
                            })
                    } else {
                        req.flash("error", "Passwords do not match.");
                        return res.redirect('back');
                    }
                })
                .catch((err) => {
                    req.flash('error', 'OOPS! Something went wrong...');
                    console.log('ERROR WHILE FINDING THE USER MODEL')
                    done(err, token, user);
                    return
                })
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail', 
                auth: {
                    user: process.env.GMAIL,
                    pass: process.env.GMAILPASSWORD
                }
            });
            var mailOptions = {
                to: user.username,
                from: process.env.GMAIL,
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.username + ' has been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('success', 'Success! Your password has been changed.');
            done(err);
            });
        }
    // callback error handling function
    ], function(err) {
        if (err) {
            req.flash('error', err.message);
            return next(err);
        }
        // if no error, then 
        res.redirect('/');
    });
});

module.exports = router