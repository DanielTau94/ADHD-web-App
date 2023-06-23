const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const bodyParser = require("body-parser");
const path = require("path"); // Added path module
const app = express();

// BD Config
const db = require("./config/keys").MongoURI;
const dbName = "classroom_management";
const uri = `${db}/${dbName}`;
const crypto = require("crypto");

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString("hex");
};
const secretKey = generateSecretKey();

// Connect to Mongo
mongoose
  .connect(uri, { useNewUrlParser: true })
  .then(() => console.log(`MongoDB Connected to ${dbName}...`))
  .catch((err) => console.log(err));

// EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// cookie parser
app.use(cookieParser());

// session middleware
app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false,
  })
);

// body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Use public directory as /static in server
app.use("/static", express.static("./"));

// Routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));

// Page Not Found
app.get("*", function (req, res) {
  res.status(404).redirect("/PageNotFound");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));