const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    promoCode: {
        type: String,
        required: false
    },

    country: {
        type: String,
        required: false,
        default: ''
    },

    city: {
        type: String,
        required: false,
        default: ''
    },

    street: {
        type: String,
        required: false,
        default: ''
    },

    zipCode: {
        type: String,
        required: false,
        default: ''
    },

    phone: {
        type: String,
        required: false,
        default: ''
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;