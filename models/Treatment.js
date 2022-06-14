const mongoose = require('mongoose');

const TreatmentSchema = new mongoose.Schema({
    treatmentNumber:{
        type: String,
        required: true
    },
    treatmentInformation:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
    workerEmail:{
        type: String,
        required: true
    },
    carNumber:{
        type: String,
        required: true
    },

});

const Treatment = mongoose.model('Treatment', TreatmentSchema);

module.exports = Treatment;