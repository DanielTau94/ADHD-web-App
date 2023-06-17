const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentID: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        return /^\d{9}$/.test(value);
      },
      message: "Student ID must be a string of 9 digits",
    },
  },
  studentName: {
    type: String,
    required: true,
  },
  studentLastName: {
    type: String,
    required: true,
  },
  studentAge: {
    type: Number,
    required: true,
  },
  studentClass: {
    type: String,
    required: true,
  },
  hasForm: {
    type: String,
    required: false,
    default: "No",
  },
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
