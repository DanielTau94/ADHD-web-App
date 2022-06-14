const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
    promo_code: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

const PromoCode = mongoose.model('PromoCode', PromoCodeSchema);

module.exports = PromoCode;