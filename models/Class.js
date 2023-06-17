const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  classSize: {
    type: Number,
    default: 0,
  },
});

const Class = mongoose.model("classrooms", ClassSchema);

module.exports = Class;
