const mongoose = require('mongoose');

const UserVerificationSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true
    },
    uniqueString:{
        type: String,
        required: true
    },
    createLink:{
        type: Date,
        required: true
    },
    expireLink:{
        type: Date,
        required: true
    }
});

const UserVerification = mongoose.model('UserVerification', UserVerificationSchema);

module.exports = UserVerification;