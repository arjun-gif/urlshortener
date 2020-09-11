const   express    = require('express'),
        router     = express.Router(),
        passport   = require('passport'),
        nodemailer = require('nodemailer'),
        async      = require('async'),
        crypto     = require('crypto'),
        middleware = require('../middleware')
        User       = require('../models/users'),
        Url        = require('../models/urls');

//* Routes
router.get('/register', (req, res) => {
    res.render('register', {page: 'register'});                     // Sending page value to nav bar
});

router.post('/register', (req, res) => {
    const newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    });
    
    User.register(newUser, req.body.password)
        .then((user) => {
            async.waterfall([
                function(done) {
                    crypto.randomBytes(20, (err, buf) => {
                        const token = buf.toString('hex');
                        done(err, token);
                    });
                },
                function(token, done) {
                    const username = req.body.username;
                    User.findOne({ username })
                        .then((user) => {
                            if (!user) {
                                req.flash('error', 'No account with that email address exists.');
                                return res.redirect('/');
                            }
                            // setting reset token to the user 
                            user.activateAccountToken = token;
                            user.activateAccountExpires = Date.now() + 3600000; // 1 hour
                            user.save((err) => {
                                done(err, token, user);
                            });
                        })
                        .catch((err) => {
                            console.log('ERROR WHILE FINDING USER WITH THAT EMAIL' + username)
                            done(err, token, user);
                            return
                        })
                },
                function(token, user, done) {
                    const smtpTransport = nodemailer.createTransport({
                    service: 'Gmail', 
                    auth: {
                        user: process.env.GMAIL,
                        pass: process.env.GMAILPASSWORD
                    }
                    });
                    // verification email content
                    const mailOptions = {
                    to: user.username,
                    from: process.env.GMAIL,
                    subject: '[URL Shortener] Please verify your email address',
                    text: 'Almost done, To complete your signup, we just need to verify your email address ' + user.username + '.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.headers.host + '/user/' + token + '\n\n' +
                        'You’re receiving this email because you recently created a new URL Shortener account or added a new email address. If this wasn’t you, please ignore this email.\n'
                    };
                    // sending the verification email
                    smtpTransport.sendMail(mailOptions, function(err) {
                    console.log('mail sent');
                    req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
                    done(err, 'done');
                    });
                }
            // callback error handling function
            ], function(err) {
                if (err) {
                    console.log(err);
                    req.flash('error', err.message);
                }
                // if no error, then 
                res.redirect('/');
            });
        })
        .catch((err) => {
            req.flash('error', err.message);
            res.redirect('back');
        })
});

router.get('/login', (req, res) => {
    res.render('login', {page: 'login'});                        // Sending page value to nav bar
});

router.post('/login', middleware.isActive, passport.authenticate('local', {
    successRedirect: "/",
    failureRedirect: '/user/login',
    failureFlash: true,
    successFlash: 'Welcome home!'
}), (req, res) => {
    console.log("DOES NOTHING. DOESN'T EVEN CONSOLE LOGS THIS STATEMENT")
});

router.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success', 'See you later!');
    res.redirect('/');
});

//* Account activation route 
router.get('/:token', (req, res) => {
    const activateAccountToken = req.params.token;
    User.findOne({ activateAccountToken, activateAccountExpires: { $gt: Date.now() }})
        .then((user) => {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/');
            }
            user.isActive = true
            user.activateAccountToken = undefined;
            user.activateAccountExpires = undefined;
            user.save()
                .then(() => {
                    req.logIn(user, (err) => {
                        res.redirect('back');
                    })
                })
                .catch((err) => {
                    console.log('ERROR WHILE REMOVING TOKEN FROM USER MODEL')
                    res.redirect('back');
                    return
                })
        })
        .catch((err) => {
            req.flash('error','Something went wrong, Please try again!');
            res.redirect('back');
        })
});

module.exports = router;