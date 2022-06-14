const express = require('express');
const router = express.Router();



// Welcome page
router.get('/', (req, res) => {
    res.render('login')

});

router.get('/buyPc', (req, res) => {
    res.render('buyPc')

});

router.get('/buyCellPhone', (req, res) => {
    res.render('buyCellPhone')
});

// Dashbord page
router.get('/dashboard', (req, res) => {
    res.render('dashboard')
});

// New Treatment page
router.get('/about', (req, res) => {
    res.render('about')

});

// New Treatment page
router.get('/profile', (req, res) => {
    res.render('profile')
});


// Page Not Found
router.get('/PageNotFound', (req, res) => {
    res.render('404');
});

module.exports = router;