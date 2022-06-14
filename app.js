const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();

// BD Config
const db = require('./config/keys').MongoURI;

// Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// EJS
app.set('view engine', 'ejs');


// cookie parser
app.use(cookieParser());


//Use public directory as /static in server
app.use('/static', express.static('./'));

// Bodyparser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

// Page Not Found
app.get('*', function (req, res) {
    res.status(404).redirect('/PageNotFound');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));