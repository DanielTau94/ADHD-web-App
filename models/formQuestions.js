const mongoose = require("mongoose");

const hyperactivityQnASchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  studentID: {
    type: String,
    required: true,
  },
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      answer: {
        type: Number,
        required: true,
      },
      treatment: {
        type: String,
        default: "", // Treatment will be automatically filled by the system
      },
    },
  ],
});

const HyperactivityQnA = mongoose.model(
  "HyperactivityQnA",
  hyperactivityQnASchema
);

module.exports = {
  HyperactivityQnA,
};