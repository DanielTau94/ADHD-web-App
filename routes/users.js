const express = require("express"); 
const path = require("path");
const router = express.Router();
const request = require("request");
const urlCrypt = require("url-crypt")(
  '~{ry*I)==yU/]9<7DPk!Hj"R#:-/Z7(hTBnlRS=4CXF'
);
const fs = require("fs");
const handlebars = require("handlebars");

const encryption = require("../encryption");

const Styliner = require("styliner");
const options = { urlPrefix: "dir/", noCSS: true };
const styliner = new Styliner(__dirname, options);

// User model
const User = require("../models/User");

const Class = require("../models/Class");

const Student = require("../models/Student");

const { HyperactivityQnA } = require("../models/formQuestions");
const HyperActiveQuestions = require("../questions/hyperactiveQuestions");

//env variables
require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

// testing nodemailer success
transporter.verify((err, success) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});

// Login Page
router.get("/login", (req, res) => {
  res.render("login");
});

// Register Page
router.get("/register", (req, res) => {
  res.render("register");
});

// Sent email Page
router.get("/sentEmail", (req, res) => {
  res.render("sentEmail");
});

router.get("/sentResetPasswordEmail", (req, res) => {
  res.render("sentResetPasswordEmail");
});

router.get("/passChangedSucc", (req, res) => {
  res.render("passChangedSucc");
});

// Register Handle
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, password2, promoCode } =
    req.body;
  const data = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
  };

  const base64 = urlCrypt.cryptObj(data);
  let originalSource = fs.readFileSync(
    path.join(__dirname, "..", "views", "emailConfirmation.html"),
    "utf8"
  );
  let registrationiLink = "http://localhost:3000/users/register/" + base64;

  const captcha = req.body["g-recaptcha-response"];

  let flagSendMail = 1;

  let errors = [];

  //Check required fields
  if (!firstName || !lastName || !email || !password || !password2) {
    errors.push({ msg: "All fields are required" });
  }
  // captcha not used
  if (!captcha) {
    errors.push({ msg: "Please verify reCAPTCHA" });
  }
  //Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  //Check passwords length
  if (password.length < 6) {
    errors.push({ msg: "Password should be minimum 6 characters" });
  }

  //Check password contain number
  if (!/\d/.test(password)) {
    errors.push({ msg: "Password should contain at least one number" });
  }

  //resul.send("This promo code is not in the system.");//

  if (errors.length > 0) {
    res.render("register", {
      errors,
      firstName,
      lastName,
      email,
      password,
      password2,
    });
  } else {
    // Secret Key
    const secretKey = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

    // Verify URL
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;

    // Make Request to VerifyURL
    request(verifyURL, async (err, response, body) => {
      body = JSON.parse(body);
      // If not success
      if (body.success !== undefined && !body.success) {
        console.log("did'nt success");
        res.redirect("/users/login");
      } else {
        // success
        // Validation passed
        const userExistCheck = await User.findOne({ email: email });
        if (userExistCheck) {
          errors.push({ msg: "Email is already in use, try another one" });
          flagSendMail = 0;
        }

        // erros
        if (!flagSendMail) {
          res.render("register", {
            errors,
            firstName,
            lastName,
            email,
            password,
            password2,
          });
        }

        // worked
        else {
          function sendEmail(source) {
            const mailOptions = {
              from: "finalprojadhd2023@gmail.com",
              to: email,
              subject: "Email verification",
              text:
                "Paste the url below into your browser to Emailify!" +
                registrationiLink,
              html: source,
            };
            transporter
              .sendMail(mailOptions)
              .then(() => {
                // email sent and verification record saved
                res.redirect("/users/sentEmail");
              })
              .catch((err) => {
                console.log(err);
                res.json({
                  status: "FAILED",
                  message: "Verification email failed",
                });
              });
          }

          styliner.processHTML(originalSource).then(function (processedSource) {
            const template = handlebars.compile(processedSource);
            const data = {
              username: firstName,
              lastname: lastName,
              link: registrationiLink,
            };
            const result = template(data);
            sendEmail(result);
          });
        }
      }
    });
  }
});

router.get("/register/:base64", async function (req, res) {
  try {
    const UserObj = urlCrypt.decryptObj(req.params.base64);
    const EncryptedPassword = encryption.encrypt(UserObj.password);
    UserObj.password = EncryptedPassword;
    await User.create(UserObj);
    res.redirect("/users/login");
  } catch (e) {
    return res.status(404).send("Bad");
  }
});

// Login Handle
router.post("/login", async (req, res, next) => {
  const captcha = req.body["g-recaptcha-response"];
  const { email, password, rememberOn } = req.body;

  let errors = [];

  //Check required fields

  //check if password contain number in it
  if (!/[^a-zA-Z]/.test(password)) {
    errors.push({ msg: "Password should contain at least one number" });
  }

  //Check passwords length
  if (password.length < 6) {
    errors.push({ msg: "Password should be minimum 6 characters" });
  }

  let regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");

  if (!regex.test(email)) {
    errors.push({ msg: "Please enter a valid email" });
  }

  if (!email || !password) {
    errors.push({ msg: "All fields are required" });
  }
  // captcha not used
  if (!captcha) {
    errors.push({ msg: "Please verify reCAPTCHA" });
  }
  if (errors.length > 0) {
    res.status(400).json({
      status: "fail",
      message: errors,
    });
  } else {
    // Secret Key
    const secretKey = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

    // Verify URL
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;

    // Make Request to VerifyURL
    request(verifyURL, async (err, response, body) => {
      body = JSON.parse(body);
      // If not success
      if (body.success !== undefined && !body.success) {
        console.log("did'nt success");
        res.redirect("/users/login");
      } else {
        // success

        const EncryptedPassword = encryption.encrypt(password);
        const LoggedUser = await User.findOne({
          $and: [{ email: email }, { password: EncryptedPassword }],
        });

        if (!LoggedUser) {
          errors.push({ msg: "User Not Found" });
          res.status(400).json({
            status: "fail",
            message: errors,
          });
        } else {
          req.session.teacherId = LoggedUser._id;
          req.session.teacherName = `${LoggedUser.firstName} ${LoggedUser.lastName}`;
          res.send(LoggedUser);
        }
      }
    });
  }
});

router.post("/addClass", async function (req, res) {
  const { className } = req.body;
  const teacherId = req.session.teacherId;
  // Check if class name is empty
  if (!className) {
    return res.render("addClass", {
      message: { type: "error", text: "Please enter a class name" },
    });
  }

  // Check if class name already exists in collection
  const classExists = await Class.exists({ className });
  if (classExists) {
    return res.render("addClass", {
      message: { type: "error", text: "Class name already exists" },
    });
  }

  // If class name does not exist and is not empty, create a new class document
  const newClass = new Class({
    className,
    teacherId, // Save the logged-in teacher's ID
    classSize: 0, // Initialize class size to 0
  });

  try {
    await newClass.save();
    // Send success message
    res.render("addClass", {
      message: { type: "success", text: "Class added successfully" },
    });
  } catch (error) {
    console.log(error);
    return res.render("addClass", {
      message: { type: "error", text: "Error adding class" },
    });
  }
});



router.post("/addStudent", async (req, res) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const age = req.body.age;
  const selectedClass = req.body.class;
  const studentID = req.body.studentID;

  // Retrieve the classes that match the teacherId
  const classrooms = await Class.find({ teacherId: req.session.teacherId });

  // Validate the form data
  if (!firstName || !lastName || !age || !selectedClass || !studentID) {
    return res.render("addStudent", {
      message: { type: "error", text: "Please fill in all fields" },
      classrooms: classrooms,
    });
  }

  // Validate name fields (letters only)
  const nameRegex = /^[a-zA-Z]+$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return res.render("addStudent", {
      message: { type: "error", text: "Invalid name format" },
      classrooms: classrooms,
    });
  }

  // Process the form data and save the student to the database
  try {
    // Check if a student with the same ID already exists
    const existingStudent = await Student.findOne({ studentID: studentID });
    if (existingStudent) {
      return res.render("addStudent", {
        message: {
          type: "error",
          text: "Student with the same ID already exists.",
        },
        classrooms: classrooms,
      });
    }

    // Create a new student document
    const newStudent = new Student({
      studentID: studentID,
      studentName: firstName,
      studentLastName: lastName,
      studentAge: age,
      studentClass: selectedClass,
    });

    await newStudent.save();

    // Update the classSize of the corresponding class
    await Class.findOneAndUpdate(
      { className: selectedClass, teacherId: req.session.teacherId },
      { $inc: { classSize: 1 } }
    );

    // Render the success message
    return res.render("addStudent", {
      message: { type: "success", text: "Student registered successfully" },
      classrooms: classrooms,
    });
  } catch (error) {
    console.log(error);
    return res.render("addStudent", {
      message: {
        type: "error",
        text: "Error registering student. Please try again later.",
      },
      classrooms: classrooms,
    });
  }
});

router.post("/deleteClass", async (req, res) => {
  try {
    const classId = req.body.classId; // Retrieve the class ID from the request body

    // Delete the class document from the collection using the class ID
    await Class.findByIdAndDelete(classId);

    // Redirect the user to the "myClasses" page or any other desired page
    res.redirect("/myClasses");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// POST route to delete a student
router.post("/deleteStudent", async (req, res) => {
  try {
    const studentId = req.body.studentId; // Retrieve the student ID from the request body

    // Find the student document using the student ID
    const student = await Student.findById(studentId);

    // If the student is found, update the class size of the corresponding class
    if (student) {
      const className = student.studentClass;

      // Decrease the classSize of the corresponding class by 1
      await Class.findOneAndUpdate(
        { className: className, teacherId: req.session.teacherId },
        { $inc: { classSize: -1 } }
      );
    }

    // Delete the student document from the collection using the student ID
    await Student.findByIdAndDelete(studentId);

    // Redirect the user to the "myStudents" page or any other desired page
    res.redirect("/myStudents");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/singleHyperActivityForm", async (req, res) => {
  try {
    const studentID = req.body.studentID; // Get the student ID from the request body

    // Check if a form already exists for the given student ID
    const existingForm = await HyperactivityQnA.findOne({ studentID });

    if (existingForm) {
      // If a form already exists, display a message to the teacher
      return res.render("singleHyperActivityForm", {
        message:
          "A form already exists for this student. Do you want to edit or delete the existing form?",
        studentID,
        editMode: true, // Set editMode to true
      });
    }

    // If a form doesn't exist, continue with displaying the questions table
    const student = await Student.findOne({ studentID });

    if (!student) {
      // Handle case where student is not found
      return res.render("singleHyperActivityForm", {
        message: "Student not found. Please enter a valid student ID.",
        studentID,
      });
    }

    // Retrieve the student's name and last name
    const studentName = `${student.studentName} ${student.studentLastName}`;

    // Store the student name and questions data in session variables
    req.session.studentName = studentName;
    req.session.questions = HyperActiveQuestions;
    req.session.answers = {}; // Initialize answers object
    req.session.studentID = studentID;
    req.session.editMode = false; // Set editMode to false

    // Redirect to the hyperactiveQnA page
    res.redirect("/users/hyperactiveQnA");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/hyperactiveQnA", (req, res) => {
  try {
    const studentName = req.session.studentName; // Retrieve the student name from the session
    const studentID = req.session.studentID;
    const questions = req.session.questions; // Retrieve the questions data from the session
    const editMode = req.session.editMode;
    let currentPage = parseInt(req.query.page) || 1; // Get the current page from the query parameter

    // Retrieve the answers from the session or initialize an empty object
    const answers = req.session.answers || {};

    if (currentPage > questions.length) {
      // Redirect to the submit page if all questions have been answered
      res.redirect("/users/submitHyperActivityForm");
      return;
    }

    // Get the current question based on the current page
    const currentQuestion = questions[currentPage - 1];

    // Retrieve the selected answer for the current question or set it to an empty string
    const selectedAnswer = answers[currentPage] || "";

    res.render("hyperactiveQnA", {
      studentName,
      studentID,
      editMode,
      questions,
      currentPage,
      currentQuestion,
      selectedAnswer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/hyperactiveQnA", (req, res) => {
  try {
    const action = req.body.action;
    let currentPage = parseInt(req.body.currentPage);
    let answer = req.body[`question${currentPage}`];
    // Save the answer to the session
    req.session.answers = req.session.answers || {};
    req.session.answers[currentPage] = answer;
    req.session.questions[currentPage - 1].answer = parseInt(answer);

    if (action === "prev") {
      currentPage = parseInt(req.body.prevPage);
    } else if (action === "next") {
      currentPage = parseInt(req.body.nextPage);
    }

    res.redirect(`/users/hyperactiveQnA?page=${currentPage}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/submitHyperactivityForm", async (req, res) => {
  try {
    const studentName = req.body.studentName;
    const studentID = req.body.studentID;
    const questions = req.session.questions; // Retrieve the questions data from the session
    const questionAnswers = [];

    for (let i = 0; i < questions.length - 1; i++) {
      const question = questions[i];
      const answer = req.session.answers[i + 1]; // Retrieve the answer based on the question index

      question.answer = parseInt(answer || 0); // Update the question's answer with the fetched value

      questionAnswers.push({
        question: question.question,
        answer: parseInt(answer || 0),
        treatment: question.treatment,
      });
    }

    // Save the answer of the last question if the action is "submit"
    if (req.body.action === "submit") {
      const lastQuestionIndex = questions.length - 1;
      const lastAnswer = req.body[`question${lastQuestionIndex + 1}`];

      questions[lastQuestionIndex].answer = parseInt(lastAnswer || 0);

      questionAnswers.push({
        question: questions[lastQuestionIndex].question,
        answer: parseInt(lastAnswer || 0),
        treatment: questions[lastQuestionIndex].treatment,
      });
    }

    const existingForm = await HyperactivityQnA.findOne({ studentID });

    if (existingForm) {
      // Update the existing form's fields
      existingForm.studentName = studentName;
      existingForm.questions = questionAnswers;
      await existingForm.save();
    } else {
      // Create a new form
      const hyperactivityQnA = new HyperactivityQnA({
        studentName: studentName,
        studentID: studentID,
        questions: questionAnswers,
      });
      await hyperactivityQnA.save();
    }

    await Student.updateOne({ studentID }, { hasForm: "Yes" });
    // Set a flash message to indicate success

    res.redirect("/formSubmitted?success=1"); // Redirect with success query parameter
  } catch (err) {
    console.error(err);
    res.redirect("/formSubmitted?error=1"); // Redirect with error query parameter
  }
});

// DELETE route for deleting the form
router.post("/deleteHyperActivityForm", async (req, res) => {
  try {
    const studentID = req.body.studentID; // Get the student ID from the request body

    // Delete the form from the HyperactivityQnA collection
    await HyperactivityQnA.deleteOne({ studentID });
    await Student.updateOne({ studentID }, { hasForm: "No" });

    // Redirect back to the singleHyperActivityForm page with a success message and the deleted flag
    res.render("singleHyperActivityForm", {
      message: "Form deleted successfully.",
      studentID,
      formDeleted: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/editHyperActivityForm", async (req, res) => {
  try {
    const studentID = req.body.studentID; // Get the student ID from the request body

    // Check if a form exists for the given student ID
    const existingForm = await HyperactivityQnA.findOne({ studentID });

    // Retrieve the student's name and last name
    const student = await Student.findOne({ studentID });
    const studentName = `${student.studentName} ${student.studentLastName}`;

    // Retrieve the questions and answers from the existing form
    const questions = existingForm.questions;

    // Store the student name, questions, answers, and student ID in session variables
    req.session.studentName = studentName;
    req.session.questions = questions;
    req.session.studentID = studentID;
    req.session.editMode = true; // Set editMode to true
    // Redirect to the hyperactiveQnA page
    res.redirect("/users/hyperactiveQnA");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/ClassHyperActivityForm", async (req, res) => {
  try {
    const className = req.body.className; // Get the class name from the request body
    const teacherId = req.session.teacherId;
    const classrooms = await Class.find({ teacherId: teacherId });
    // Find all students with the matching class name
    const students = await Student.find({ studentClass: className });

    if (students.length === 0) {
      // Handle case where no students are found for the class
      return res.render("ClassHyperActivityForm", {
        message:
          "No students found for the selected class. Please choose another class.",
        classrooms,
      });
    }

    const ITEMS_PER_PAGE = 3; // Number of students to display per page

    // Calculate pagination variables
    const totalStudents = students.length;
    const currentPage = 1; // Always start from the first page

    // Retrieve the paginated student data for the current page

    // Redirect to the displayStudentsInClass route
    res.redirect(
      `/displayStudentsInClass?className=${className}&page=${currentPage}`
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/ClasshyperactiveQnA", (req, res) => {
  try {
    const studentName = req.session.studentName; // Retrieve the student name from the session
    const studentID = req.session.studentID;
    const questions = req.session.questions; // Retrieve the questions data from the session
    const editMode = req.session.editMode;
    let currentPage = parseInt(req.query.page) || 1; // Get the current page from the query parameter

    // Retrieve the answers from the session or initialize an empty object
    const answers = req.session.answers || {};

    if (currentPage > questions.length) {
      // Redirect to the submit page if all questions have been answered
      res.redirect("/users/submitClassHyperActivityForm");
      return;
    }

    // Get the current question based on the current page
    const currentQuestion = questions[currentPage - 1];

    // Retrieve the selected answer for the current question or set it to an empty string
    const selectedAnswer = answers[currentPage] || "";

    res.render("ClassHyperactiveQnA", {
      studentName,
      studentID,
      editMode,
      questions,
      currentPage,
      currentQuestion,
      selectedAnswer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/ClassHyperactiveQnA", (req, res) => {
  try {
    const action = req.body.action;
    let currentPage = parseInt(req.body.currentPage);
    let answer = req.body[`question${currentPage}`];
    // Save the answer to the session
    req.session.answers = req.session.answers || {};
    req.session.answers[currentPage] = answer;
    req.session.questions[currentPage - 1].answer = parseInt(answer);

    if (action === "prev") {
      currentPage = parseInt(req.body.prevPage);
    } else if (action === "next") {
      currentPage = parseInt(req.body.nextPage);
    }

    res.redirect(`/users/ClassHyperactiveQnA?page=${currentPage}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/submitClassHyperactivityForm", async (req, res) => {
  try {
    const studentName = req.body.studentName;
    const studentID = req.body.studentID;
    const questions = req.session.questions; // Retrieve the questions data from the session
    const questionAnswers = [];
    for (let i = 0; i < questions.length - 1; i++) {
      const question = questions[i];
      const answer = req.session.answers[i + 1]; // Retrieve the answer based on the question index

      question.answer = parseInt(answer || 0); // Update the question's answer with the fetched value

      questionAnswers.push({
        question: question.question,
        answer: parseInt(answer || 0),
      });
    }

    // Save the answer of the last question if the action is "submit"
    if (req.body.action === "submit") {
      const lastQuestionIndex = questions.length - 1;
      const lastAnswer = req.body[`question${lastQuestionIndex + 1}`];

      questions[lastQuestionIndex].answer = parseInt(lastAnswer || 0);

      questionAnswers.push({
        question: questions[lastQuestionIndex].question,
        answer: parseInt(lastAnswer || 0),
      });
    }
    const existingForm = await HyperactivityQnA.findOne({ studentID });

    if (existingForm) {
      // Update the existing form's fields
      existingForm.studentName = studentName;
      existingForm.questions = questionAnswers;
      await existingForm.save();
    } else {
      // Create a new form
      const hyperactivityQnA = new HyperactivityQnA({
        studentName: studentName,
        studentID: studentID,
        questions: questionAnswers,
      });
      await hyperactivityQnA.save();
    }

    res.redirect("/success"); // Handle success case
  } catch (err) {
    console.error(err);
    res.redirect("/error"); // Handle error case
  }
});

router.post("/singleTreatmentPlan", async (req, res) => {
  try {
    const studentID = req.body.studentID; // Get the student ID from the request body

    // Check if a treatment plan already exists for the given student ID
    const existingTreatmentPlan = await HyperactivityQnA.findOne({ studentID });

    if (existingTreatmentPlan) {
      // If a treatment plan already exists, redirect to the displaySingleTreatmentPlan route
      return res.redirect(`/displaySingleTreatmentPlan?studentID=${studentID}`);
    }

    // If a treatment plan doesn't exist, render the page with an error message
    return res.render("singleTreatmentPlan", {
      message: "Treatment plan does not exist for this student.",
      studentID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/classTreatmentPlan", async (req, res) => {
  try {
    const className = req.body.className; // Get the class name from the request body
    const teacherId = req.session.teacherId;
    const classrooms = await Class.find({ teacherId: teacherId });
    // Find all students with the matching class name
    const students = await Student.find({ studentClass: className });

    if (students.length === 0) {
      // Handle case where no students are found for the class
      return res.render("classTreatmentPlan", {
        message: {
          type: "error",
          text: "No students found for the selected class. Please choose another class.",
        },
        classrooms: classrooms,
      });
    }

    const ITEMS_PER_PAGE = 3; // Number of students to display per page

    // Calculate pagination variables
    const totalStudents = students.length;
    const currentPage = 1; // Always start from the first page

    // Retrieve the paginated student data for the current page

    // Redirect to the displayStudentsInClass route
    res.redirect(
      `/displayClassTreatmentPlan?className=${className}&page=${currentPage}`
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/getStudent', async (req, res) => {
  const { studentID } = req.query;
  console.log("im here daniel");

  try {
    const students = await Student.find({ studentID: studentID });
    console.log(students);

    if (students.length > 0 && students[0].hasForm === 'Yes') {
      console.log("true!");
      res.json({ hasForm: true });
    } else {
      console.log("false!");
      res.json({ hasForm: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.get("/resetPassword", function (req, res) {
  res.render("resetPassword");
});

router.post("/resetPassword", function (req, res) {
  const { email } = req.body;
  let errors = [];

  //Check required field
  if (!email) {
    errors.push({ msg: "Please insert your email" });
  }

  if (errors.length > 0) {
    res.render("resetPassword", {
      errors,
      email,
    });
  } else {
    // Validation passed
    User.findOne({ email: email }).then((user) => {
      if (!user) {
        //User does not exists
        errors.push({ msg: "Email is not found" });
        res.render("resetPassword", {
          email: email,
        });
      } else {
        const data = {
          email: email,
        };
        const base64 = urlCrypt.cryptObj(data);

        const resetPasswordLink =
          "http://localhost:3000/users/updatePassword/" + base64;
        let originalSource = fs.readFileSync(
          path.join(__dirname, "..", "views", "forgetPasswordEmail.html"),
          "utf8"
        );

        function sendEmail1(source) {
          const mailOptions = {
            from: "finalprojadhd2023@gmail.com",
            to: email,
            subject: "Reset password",
            text: "Paste the url below into your browser to getPassword!",
            html: source,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              res.json({
                status: "FAILED",
                message: "ERROR",
              });
            } else {
              res.redirect("/users/sentResetPasswordEmail");
            }
          });
        }
        styliner.processHTML(originalSource).then(function (processedSource) {
          const template = handlebars.compile(processedSource);
          const data = { link: resetPasswordLink };
          const result = template(data);
          sendEmail1(result);
          resul.send("Success");
        });
      }
    });
  }
});

router.get("/updatePassword/:base64", function (req, res) {
  res.render("updatePassword", {
    base64: req.params.base64,
  });
});

router.post("/updatePassword/:base64", async function (req, res) {
  const { password, password2 } = req.body;
  const base64 = req.params.base64;
  let originalSource = fs.readFileSync(
    path.join(__dirname, "..", "views", "emailUpdatePassword.html"),
    "utf8"
  );

  let errors = [];

  //Check required fields
  if (!password || !password2) {
    errors.push({ msg: "All fields are required" });
  }

  //Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  //check if password contain number in it
  if (!/[^a-zA-Z]/.test(password)) {
    errors.push({ msg: "Password should contain at least one number" });
  }

  //Check passwords length
  if (password.length < 6) {
    errors.push({ msg: "Password should be minimum 6 characters" });
  }

  if (errors.length > 0) {
    res.render("updatePassword", {
      errors,
      base64,
      password,
      password2,
    });
  } else {
    // New Paswword
    const newPass = req.body.password;
    const EncryptedPassword = encryption.encrypt(newPass);
    try {
      const EmailObj = urlCrypt.decryptObj(base64);
      await User.updateOne(
        { email: EmailObj.email },
        { password: EncryptedPassword }
      );

      function sendEmail1(source) {
        const mailOptions = {
          from: "finalprojadhd2023@gmail.com",
          to: EmailObj.email,
          subject: "Password Changed Succsufly",
          text: "Updated password!",
          html: source,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            res.json({
              status: "FAILED",
              message: "ERROR",
            });
          } else {
            res.redirect("/users/passChangedSucc");
          }
        });
      }
      styliner.processHTML(originalSource).then(function (processedSource) {
        const template = handlebars.compile(processedSource);
        const data = { info: "We have really important information for you" };
        const result = template(data);
        sendEmail1(result);
      });
    } catch (e) {
      return res.status(404).send("Bad");
    }
  }
});

router.post("/getProfile", async function (req, res) {
  const { id } = req.body;
  let user = await User.findById({ _id: id });
  let EncryptedPassword = encryption.decrypt(user.password);
  user.password = EncryptedPassword;
  res.send(user);
});

router.post("/updateProfile", async function (req, res) {
  let originalSource = fs.readFileSync(
    path.join(__dirname, "..", "views", "emailWantToChange.html"),
    "utf8"
  );
  const {
    firstName,
    lastName,
    email,
    phone,
    country,
    city,
    street,
    zipCode,
    prevEmail,
    id,
  } = req.body;
  const filter = { _id: id };
  const update = {
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    country: country,
    city: city,
    street: street,
    zipCode: zipCode,
  };

  await User.findOneAndUpdate(filter, update);

  let regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");
  if (!regex.test(email)) {
    res.send("This email is not valid, please try again");
  }

  if (email != prevEmail) {
    const userExistCheck = await User.findOne({ email: email });
    if (userExistCheck) {
      res.send(
        "This email already in use , we can't change it. your other data has been saved."
      );
    }
    const data = {
      id: id,
      email: email,
    };
    const base64 = urlCrypt.cryptObj(data);
    const registrationiLink =
      "http://localhost:3000/users/updateMail/" + base64;

    function sendEmail1(source) {
      const mailOptions = {
        from: "finalprojadhd2023@gmail.com",
        to: email,
        subject: "Confirm Changing email",
        text: "Paste the url below into your browser to getPassword!",
        html: source,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.json({
            status: "FAILED",
            message: "ERROR",
          });
        } else {
          res.send(
            "Updated profile successfully, an email has been sent to you to change your email adress"
          );
        }
      });
    }

    styliner.processHTML(originalSource).then(function (processedSource) {
      const template = handlebars.compile(processedSource);
      const data = {
        firstName: firstName,
        lastName: lastName,
        link: registrationiLink,
      };
      const result = template(data);
      sendEmail1(result);
    });
    res.send(
      "Updated profile successfully, an email has been sent to you to change your email adress"
    );
  } else res.send("Your details have been changed successfully!");
});

router.get("/updateMail/:base64", async function (req, res) {
  try {
    const UserObj = urlCrypt.decryptObj(req.params.base64);
    await User.findOneAndUpdate({ _id: UserObj.id }, { email: UserObj.email });
    res.redirect("/users/login");
  } catch (e) {
    return res.status(404).send("Bad");
  }
});

router.post("/changePassword", async function (req, res) {
  const { oldPassword, newPassword, confirmPassword, id } = req.body;

  let user = await User.findById({ _id: id });
  let currentUserPassword = encryption.decrypt(user.password);
  let errors = [];

  //Check required fields
  if (!oldPassword || !newPassword || !confirmPassword) {
    errors.push({ msg: "All the fields are required" });
  }

  //Check password new equals to old
  if (newPassword == oldPassword) {
    errors.push({ msg: "Using your old password is not allowed" });
  }

  //Check passwords match
  if (newPassword !== confirmPassword) {
    errors.push({ msg: "Passwords are not the same, Please try again" });
  }

  if (oldPassword != currentUserPassword) {
    errors.push({ msg: "Old password and current password are not matched" });
  }

  //Check passwords length
  if (newPassword.length < 6) {
    errors.push({ msg: "Password should be minimum 6 characters" });
  }

  if (!/[^a-zA-Z]/.test(newPassword))
    errors.push({ msg: "Password should contain at least one number" });

  if (errors.length > 0) {
    res.status(400).json({
      status: "fail",
      message: errors,
    });
  } else {
    // New Paswword
    const EncryptedPassword = encryption.encrypt(newPassword);
    try {
      await User.updateOne(
        { email: user.email },
        { password: EncryptedPassword }
      );
      res.status(200).json({
        status: "success",
        data: "Password was changed successfully!",
      });
    } catch (e) {
      return res.status(404).send("Bad");
    }
  }
});

module.exports = router;
