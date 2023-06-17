const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/Student");
const { HyperactivityQnA } = require("../models/formQuestions");

// Welcome page
router.get("/", (req, res) => {
  res.render("login");
});

// Dashbord page
router.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

// New About page
router.get("/about", (req, res) => {
  res.render("about");
});

// New Profile page
router.get("/profile", (req, res) => {
  res.render("profile");
});

router.get("/addClass", (req, res) => {
  const message = "";
  res.render("addClass", { message: message });
});

router.get("/addForm", async (req, res) => {
  try {
    const teacherName = req.session.teacherName;

    res.render("addForm", { teacherName });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/formSubmitted", (req, res) => {
  const successMessage = req.query.success
    ? "The student form has been added/updated successfully."
    : null;
  const errorMessage = req.query.error
    ? "An error occurred while submitting the form."
    : null;

  res.render("formSubmitted", { successMessage, errorMessage });
});

router.get("/SingleTreatmentPlan", (req, res) => {
  res.render("SingleTreatmentPlan");
});

router.get("/myClasses", async (req, res) => {
  try {
    const perPage = 3; // Number of classes to display per page
    const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter

    const teacherId = req.session.teacherId; // Retrieve teacherId from the session

    // Retrieve the total number of classes in the collection that match the teacherId
    const totalClasses = await Class.countDocuments({ teacherId: teacherId });

    // Calculate the total number of pages based on the number of classes and classes per page
    const totalPages = Math.ceil(totalClasses / perPage);

    // Retrieve the classes for the current page that match the teacherId
    const classrooms = await Class.find({ teacherId: teacherId })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render("myClasses", { classrooms, totalPages, currentPage: page });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/myStudents", async (req, res) => {
  try {
    const perPage = 100; // Number of students to display per page
    const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter
    const teacherId = req.session.teacherId; // Retrieve teacherId from the session

    // Retrieve the classes that match the teacherId
    const classrooms = await Class.find({ teacherId: teacherId });
    console.log(classrooms);
    // Retrieve the total number of students in the collection that belong to the teacher's classes
    const totalStudents = await Student.countDocuments({
      studentClass: { $in: classrooms.map((classroom) => classroom.className) },
    });

    // Calculate the total number of pages based on the number of students and students per page
    const totalPages = Math.ceil(totalStudents / perPage);

    // Retrieve the students for the current page that belong to the teacher's classes
    const students = await Student.find({
      studentClass: { $in: classrooms.map((classroom) => classroom.className) },
    })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render("myStudents", {
      students,
      classrooms,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/addStudent", async (req, res) => {
  try {
    const teacherId = req.session.teacherId;
    const message = "";

    // Retrieve the classes that match the teacherId
    const classrooms = await Class.find({ teacherId: teacherId });

    res.render("addStudent", { classrooms, message: message });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/singleHyperActivityForm", (req, res) => {
  res.render("singleHyperActivityForm");
});

router.get("/classHyperActivityForm", async (req, res) => {
  try {
    const teacherId = req.session.teacherId; // Retrieve teacherId from the session
    const classrooms = await Class.find({ teacherId: teacherId });
    req.session.classrooms = classrooms;

    res.render("classHyperActivityForm", { classrooms });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/displayStudentsInClass", async (req, res) => {
  try {
    console.log("im here! 123");
    const className = req.query.className; // Get the class name from the query parameter
    const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter
    const ITEMS_PER_PAGE = 3; // Number of students to display per page
    // Find all students with the matching class name
    const students = await Student.find({ studentClass: className });
    // Calculate pagination variables
    const totalStudents = students.length;
    const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = page * ITEMS_PER_PAGE;

    // Retrieve the paginated student data for the current page
    const paginatedStudents = students.slice(startIndex, endIndex);

    // Render the template with pagination and student data
    res.render("displayStudentsInClass", {
      students: paginatedStudents,
      className: className,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/displaySingleTreatmentPlan", async (req, res) => {
  try {
    const studentID = req.query.studentID; // Get the student ID from the query parameter

    // Check if a treatment plan exists for the given student ID
    const existingTreatmentPlan = await HyperactivityQnA.findOne({ studentID });

    if (!existingTreatmentPlan) {
      // If a treatment plan doesn't exist, render the page with an error message
      return res.render("displaySingleTreatmentPlan", {
        message: "Treatment plan does not exist for this student.",
        studentID,
      });
    }

    // Treatment plan exists, render the page with the plan data
    res.render("displaySingleTreatmentPlan", {
      treatmentPlan: existingTreatmentPlan,
      studentID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/classTreatmentPlan", async (req, res) => {
  try {
    const message = "";
    const teacherId = req.session.teacherId; // Retrieve teacherId from the session
    const classrooms = await Class.find({ teacherId: teacherId });
    req.session.classrooms = classrooms;

    res.render("classTreatmentPlan", { classrooms, message: message });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/displayClassTreatmentPlan", async (req, res) => {
  try {
    const className = req.query.className; // Get the class name from the query parameter
    const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter
    const ITEMS_PER_PAGE = 3; // Number of questions to display per page

    // Find all students with the matching class name
    const students = await Student.find({ studentClass: className });

    // Calculate pagination variables
    const totalStudents = students.length;
    const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    // Retrieve the treatment plans for all students
    const studentIds = students.map((student) => student.studentID);
    const treatmentPlans = await HyperactivityQnA.find({
      studentID: { $in: studentIds },
    });

    // Create an object to map the student IDs to their corresponding treatment plans
    const treatmentPlanMap = {};
    treatmentPlans.forEach((plan) => {
      treatmentPlanMap[plan.studentID] = plan.questions;
    });

    // Calculate the total number of questions
    let totalQuestions = 0;
    for (const studentId of studentIds) {
      const questions = treatmentPlanMap[studentId];
      if (questions) {
        totalQuestions += questions.length;
      }
    }

    // Render the template with pagination, student data, treatment plans, and total questions
    res.render("displayClassTreatmentPlan", {
      students: students,
      className: className,
      totalPages: totalPages,
      currentPage: page,
      treatmentPlans: treatmentPlanMap,
      startIndex: startIndex,
      endIndex: endIndex - 1,
      totalQuestions: totalQuestions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Page Not Found
router.get("/PageNotFound", (req, res) => {
  res.render("404");
});

module.exports = router;
