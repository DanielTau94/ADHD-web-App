const express = require('express');
const path = require('path');
const router = express.Router();
const request = require('request');
const urlCrypt = require('url-crypt')('~{ry*I)==yU/]9<7DPk!Hj"R#:-/Z7(hTBnlRS=4CXF');
const fs = require('fs');
const handlebars = require('handlebars');

const encryption = require("../encryption");

const Styliner = require('styliner');
const options = { urlPrefix: "dir/", noCSS: true };
const styliner = new Styliner(__dirname, options);

// User model
const User = require('../models/User');

// promoCode model
const PromoCode = require('../models/PromoCode');

//env variables
require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
})

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
router.get('/login', (req, res) => {
    res.render('login')
});

// Register Page
router.get('/register', (req, res) => {
    res.render('register')
});

// Sent email Page
router.get('/sentEmail', (req, res) => {
    res.render('sentEmail')
});

router.get('/sentResetPasswordEmail', (req, res) => {
    res.render('sentResetPasswordEmail')
});

router.get('/passChangedSucc', (req, res) => {
    res.render('passChangedSucc')
});


// Register Handle
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, password2, promoCode } = req.body;
    const data = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        promoCode: req.body.promoCode
    };

    const base64 = urlCrypt.cryptObj(data);
    let originalSource = fs.readFileSync(path.join(__dirname, '..', 'views', 'emailConfirmation.html'), 'utf8');
    let registrationiLink = 'http://localhost:3000/users/register/' + base64;

    const captcha = req.body['g-recaptcha-response'];

    let flagSendMail = 1;

    let errors = [];

    //Check required fields
    if (!firstName || !lastName || !email || !password || !password2) {
        errors.push({ msg: 'All fields are required' });
    }
    // captcha not used
    if (!captcha) {
        errors.push({ msg: 'Please verify reCAPTCHA' });
    }
    //Check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    //Check passwords length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be minimum 6 characters' });
    }

    //Check password contain number
    if (!/\d/.test(password)) {
        errors.push({ msg: 'Password should contain at least one number' });
    }

    //resul.send("This promo code is not in the system.");//

    if (errors.length > 0) {
        res.render('register', {
            errors,
            firstName,
            lastName,
            email,
            password,
            password2,
            promoCode
        });
    } else {

        // Secret Key
        const secretKey = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

        // Verify URL
        const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;

        // Make Request to VerifyURL
        request(verifyURL, async (err, response, body) => {
            body = JSON.parse(body);
            // If not success
            if (body.success !== undefined && !body.success) {
                console.log("did'nt success");
                res.redirect('/users/login');
            } else { // success
                // Validation passed
                if (promoCode != '') {
                    const promoCodeCheck = await PromoCode.findOne({ promo_code: promoCode })
                    if (!promoCodeCheck) {
                        errors.push({ msg: 'Promo code is not available' });
                        flagSendMail = 0;
                    }
                }

                const userExistCheck = await User.findOne({ email: email })
                if (userExistCheck) {
                    errors.push({ msg: 'Email is already in use, try another one' });
                    flagSendMail = 0;
                }

                // erros
                if (!flagSendMail) {
                    res.render('register', {
                        errors,
                        firstName,
                        lastName,
                        email,
                        password,
                        password2,
                        promoCode
                    });
                }

                // worked
                else {
                    function sendEmail(source) {
                        const mailOptions = {
                            from: 'projclientside2022@gmail.com',
                            to: email,
                            subject: 'Email verification',
                            text: "Paste the url below into your browser to Emailify!" + registrationiLink,
                            html: source
                        };
                        transporter.sendMail(mailOptions)
                            .then(() => {
                                // email sent and verification record saved
                                res.redirect('/users/sentEmail');
                            })
                            .catch((err) => {
                                console.log(err);
                                res.json({
                                    status: 'FAILED',
                                    message: 'Verification email failed',
                                });
                            })

                    }

                    styliner.processHTML(originalSource)
                        .then(function (processedSource) {
                            const template = handlebars.compile(processedSource);
                            const data = { "username": firstName, "lastname": lastName, "link": registrationiLink }
                            const result = template(data);
                            sendEmail(result)
                        });
                }

            }
        });

    }
});

router.get('/register/:base64', async function (req, res) {
    try {
        const UserObj = urlCrypt.decryptObj(req.params.base64);
        const EncryptedPassword = encryption.encrypt(UserObj.password);
        UserObj.password = EncryptedPassword;
        await User.create(UserObj);
        res.redirect('/users/login');
    } catch (e) {
        return res.status(404).send('Bad');
    }
})


// Login Handle
router.post('/login', async (req, res, next) => {
    const captcha = req.body['g-recaptcha-response'];
    const { email, password, rememberOn } = req.body;


    let errors = [];


    //Check required fields

        //check if password contain number in it
        if (!/[^a-zA-Z]/.test(password)) {
            errors.push({ msg: 'Password should contain at least one number' });
        }
    
        //Check passwords length
        if (password.length < 6) {
            errors.push({ msg: 'Password should be minimum 6 characters' });
        }

let regex = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');

if(!regex.test(email))
{
    errors.push({ msg: 'Please enter a valid email' }); 
}

        
    if (!email || !password) {
        errors.push({ msg: 'All fields are required' });
    }
    // captcha not used
    if (!captcha) {
        errors.push({ msg: 'Please verify reCAPTCHA' });

    }
    if (errors.length > 0) {
        res.status(400).json({
            status: 'fail',
            message: errors
        })
    } else {

        // Secret Key
        const secretKey = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

        // Verify URL
        const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;

        // Make Request to VerifyURL
        request(verifyURL, async (err, response, body) => {
            body = JSON.parse(body);
            // If not success
            if (body.success !== undefined && !body.success) {
                console.log("did'nt success");
                res.redirect('/users/login');
            } else { // success

                const EncryptedPassword = encryption.encrypt(password);
                const LoggedUser = await User.findOne({
                    $and: [
                        { email: email },
                        { password: EncryptedPassword }
                    ]
                })

                if (!LoggedUser) {
                    errors.push({ msg: 'User Not Found' });
                    res.status(400).json({
                        status: 'fail',
                        message: errors
                    })
                } else {

                    res.send(LoggedUser);

                }
            }
        })


    }
});

router.get('/resetPassword', function (req, res) {
    res.render('resetPassword')
})

router.post('/resetPassword', function (req, res) {
    const { email } = req.body;
    let errors = [];

    //Check required field
    if (!email) {
        errors.push({ msg: 'Please insert your email' });
    }

    if (errors.length > 0) {
        res.render('resetPassword', {
            errors,
            email
        });
    } else {
        // Validation passed
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    //User does not exists
                    errors.push({ msg: 'Email is not found' });
                    res.render('resetPassword', {
                        email: email
                    });
                } else {
                    const data = {
                        email: email
                    };
                    const base64 = urlCrypt.cryptObj(data);

                    const resetPasswordLink = 'http://localhost:3000/users/updatePassword/' + base64;
                    let originalSource = fs.readFileSync(path.join(__dirname, '..', 'views', 'forgetPasswordEmail.html'), 'utf8');

                    function sendEmail1(source) {

                        const mailOptions = {
                            from: 'projclientside2022@gmail.com',
                            to: email,
                            subject: 'Reset password',
                            text: "Paste the url below into your browser to getPassword!",
                            html: source
                        };


                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                res.json({
                                    status: 'FAILED',
                                    message: 'ERROR',
                                });
                            } else {
                                res.redirect('/users/sentResetPasswordEmail');
                            }
                        });

                    }
                    styliner.processHTML(originalSource)
                        .then(function (processedSource) {
                            const template = handlebars.compile(processedSource);
                            const data = { "link": resetPasswordLink }
                            const result = template(data);
                            sendEmail1(result)
                            resul.send("Success");
                        });

                }
            });
    }
})

router.get('/updatePassword/:base64', function (req, res) {
    res.render('updatePassword', {
        base64: req.params.base64
    });
})




router.post('/updatePassword/:base64', async function (req, res) {
    const { password, password2 } = req.body;
    const base64 = req.params.base64;
    let originalSource = fs.readFileSync(path.join(__dirname, '..', 'views', 'emailUpdatePassword.html'), 'utf8');


    let errors = [];

    //Check required fields
    if (!password || !password2) {
        errors.push({ msg: 'All fields are required' });
    }

    //Check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    //check if password contain number in it
    if (!/[^a-zA-Z]/.test(password)) {
        errors.push({ msg: 'Password should contain at least one number' });
    }

    //Check passwords length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be minimum 6 characters' });
    }

    if (errors.length > 0) {
        res.render('updatePassword', {
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
            await User.updateOne({ email: EmailObj.email }, { password: EncryptedPassword });

            function sendEmail1(source) {
                const mailOptions = {
                    from: 'projclientside2022@gmail.com',
                    to: EmailObj.email,
                    subject: 'Password Changed Succsufly',
                    text: "Updated password!",
                    html: source
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        res.json({
                            status: 'FAILED',
                            message: 'ERROR',
                        });
                    } else {
                        res.redirect('/users/passChangedSucc');
                    }
                });

            }
            styliner.processHTML(originalSource)
                .then(function (processedSource) {
                    const template = handlebars.compile(processedSource);
                    const data = { "info": "We have really important information for you" }
                    const result = template(data);
                    sendEmail1(result)
                });

        } catch (e) {
            return res.status(404).send('Bad');
        }
    }

})

router.post('/getProfile', async function (req, res) {
    const { id } = req.body;
    let user = await User.findById({ _id: id })
    let EncryptedPassword = encryption.decrypt(user.password);
    user.password = EncryptedPassword;
    res.send(user);
})


router.post('/updateProfile', async function (req, res) {
    let originalSource = fs.readFileSync(path.join(__dirname, '..', 'views', 'emailWantToChange.html'), 'utf8');
    const { firstName, lastName, email, phone, country, city, street, zipCode, prevEmail, id } = req.body;
    const filter = { _id: id };
    const update = {
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        country: country,
        city: city,
        street: street,
        zipCode: zipCode
    };

    await User.findOneAndUpdate(filter, update);
    
    let regex = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');
    if(!regex.test(email))
    {
        res.send("This email is not valid, please try again")
    }

    if (email != prevEmail) {
        const userExistCheck = await User.findOne({ email: email })
        if (userExistCheck) {
            res.send("This email already in use , we can't change it. your other data has been saved.")
        }
        const data = {
            id: id,
            email: email
        };
        const base64 = urlCrypt.cryptObj(data);
        const registrationiLink = 'http://localhost:3000/users/updateMail/' + base64;

        function sendEmail1(source) {

            const mailOptions = {
                from: 'projclientside2022@gmail.com',
                to: email,
                subject: 'Confirm Changing email',
                text: "Paste the url below into your browser to getPassword!",
                html: source
            };


            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    res.json({
                        status: 'FAILED',
                        message: 'ERROR',
                    });
                } else {
                    res.send("Updated profile successfully, an email has been sent to you to change your email adress")
                }
            });
        }

        styliner.processHTML(originalSource)
            .then(function (processedSource) {
                const template = handlebars.compile(processedSource);
                const data = { "firstName": firstName, "lastName": lastName, "link": registrationiLink }
                const result = template(data);
                sendEmail1(result)
            });
        res.send("Updated profile successfully, an email has been sent to you to change your email adress")

    } 
    else 
        res.send("Your details have been changed successfully!")
    
})

router.get('/updateMail/:base64', async function (req, res) {
    try {
        const UserObj = urlCrypt.decryptObj(req.params.base64);
        await User.findOneAndUpdate({ _id: UserObj.id }, { email: UserObj.email });
        res.redirect('/users/login');

    } catch (e) {
        return res.status(404).send('Bad');
    }
})

router.post('/changePassword', async function (req, res) {
    const { oldPassword, newPassword, confirmPassword, id } = req.body;

    let user = await User.findById({ _id: id })
    let currentUserPassword = encryption.decrypt(user.password);
    let errors = [];

    //Check required fields
    if (!oldPassword || !newPassword || !confirmPassword) {
        errors.push({ msg: 'All the fields are required' });
    }

    //Check password new equals to old
    if (newPassword == oldPassword) {
        errors.push({ msg: 'Using your old password is not allowed' });
    }


    //Check passwords match
    if (newPassword !== confirmPassword) {
        errors.push({ msg: 'Passwords are not the same, Please try again' });
    }

    if (oldPassword != currentUserPassword) {
        errors.push({ msg: 'Old password and current password are not matched' });
    }

    //Check passwords length
    if (newPassword.length < 6) {
        errors.push({ msg: 'Password should be minimum 6 characters' });
    }

    
    if (!/[^a-zA-Z]/.test(newPassword)) 
        errors.push({ msg: 'Password should contain at least one number' });
    

    if (errors.length > 0) {
        res.status(400).json({
            status: 'fail',
            message: errors
        })
    } else {
        // New Paswword
        const EncryptedPassword = encryption.encrypt(newPassword);
        try {
            await User.updateOne({ email: user.email }, { password: EncryptedPassword });
            res.status(200).json({
                status: 'success',
                data: "Password was changed successfully!"
            })

        } catch (e) {
            return res.status(404).send('Bad');
        }
    }
})


module.exports = router;