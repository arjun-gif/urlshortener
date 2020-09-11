const   mongoose = require('mongoose');

var UrlSchema = new mongoose.Schema({
    originalUrl: String,
    shortenedUrl: String,
    clicked: {
        type: Number,
        default: 0
    }
},
{timestamps:true}
);

module.exports = mongoose.model('Url', UrlSchema);