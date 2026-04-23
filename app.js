if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
app.set("trust proxy", 1);

const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');
const categories = require("./utils/category.js");

// Routes
const indexRouter = require('./routes/index.js');
const listingRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const orderRoutes = require("./routes/order");

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

// ================= DATABASE =================
const port = process.env.PORT || 8080;
const dbUrl = process.env.ATLASDB_URL;
const mySecret = process.env.MY_SECRET;

mongoose.connect(dbUrl)
    .then(() => console.log("Connected to Database"))
    .catch(err => console.log(err));

// ================= SESSION =================
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: mySecret },
    touchAfter: 24 * 3600
});

app.use(session({
    store,
    secret: mySecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

app.use(flash());

// ================= PASSPORT =================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ================= GLOBAL LOCALS =================
app.use((req, res, next) => {
    res.locals.currUser = req.user;

    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.warning = req.flash("warning"); // ✅ ADD THIS

    res.locals.razorpayKey = process.env.RAZORPAY_KEY_ID;
    res.locals.listingCategories = categories;

    next();
});

// ================= ROUTES =================
app.use('/', indexRouter);
app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/user', userRouter);

// 🔥 IMPORTANT CHANGE
app.use('/orders', orderRoutes);

// ================= ERROR =================
app.use((req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'));
});

app.use((err, req, res, next) => {
    const { status = 500, message = "Something went wrong" } = err;
    res.status(status).render("listings/error", { message });
});

// ================= SERVER =================
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});