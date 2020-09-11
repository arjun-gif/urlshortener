const   express        = require('express'),
        app            = express(),
        bodyParser     = require('body-parser'),
        mongoose       = require('mongoose'),
        passport       = require('passport'),
        localStrategy  = require('passport-local'),
        methodOverride = require('method-override'),
        flash          = require('connect-flash'),
        User           = require('./models/users');
        Url            = require('./models/urls');

// env variable requiring
require('dotenv').config();

//* Requiring Routes
const   indexRoutes = require('./routes/index'),
        userRoutes = require('./routes/user'),
        resetRoutes = require('./routes/reset'),
        urlRoutes   = require('./routes/show');

const { urlencoded } = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());

//* Connecting to the database
mongoose.connect(process.env.DBURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    })
    .then(() => {
        console.log('Connected to DB')
    })
    .catch((err) => {
        console.log(err)
    });

//* Passport Configuration
app.use(require('express-session')({
    secret: "Poda andha aandavane namma pakam dhan irukan!!!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//* Middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

//* Routes
app.use('/reset', resetRoutes);
app.use('/user', userRoutes);
app.use('/url', urlRoutes); 
app.use('/', indexRoutes);

//* 404 Page 
app.get('*', (req, res) => {
    res.render('404');
});

//*  Server setup
app.listen(process.env.PORT, process.env.IP, () => {
    console.log('URL Shortener server has started');
});