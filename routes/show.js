const   express    = require('express'),
        router     = express.Router(),
        shortUrl   = require('shortid'),
        middleware = require('../middleware'),
        Url        = require('../models/urls');

//* Create a new url
router.get('/new', middleware.isLoggedIn, (req,res) => {
    res.render('url/new');
})

router.post('/new', middleware.isLoggedIn, async (req,res) => {
    const   originalUrl = req.body.originalUrl,
            shortenedUrl = shortUrl.generate();
    await Url.create({originalUrl, shortenedUrl})
    req.flash('success', 'A short URL has been created ...');
    res.redirect('/')
})

module.exports = router;