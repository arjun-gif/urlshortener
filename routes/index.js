const   express  = require('express'),
        router   = express.Router(),
        Url      = require('../models/urls');

//* Landing page 
router.get('/', async (req,res) => {
    const urlData =  await Url.find();
    res.render('url/show', {urlData});
})

//* Redirection
router.get('/:shortUrl', async (req, res) => {
    const shortenedUrl = req.params.shortUrl;
    const newUrl = await Url.findOne({shortenedUrl});
    if (newUrl == null) {
        res.render('404')
    } else {
    newUrl.clicked++;
    newUrl.save();
    res.redirect('http://'+ newUrl.originalUrl)
    }
})

module.exports = router;