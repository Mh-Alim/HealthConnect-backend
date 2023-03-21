const express = require("express");
const { updateStatus,deleteAppointment, patientList, takeAppointment, completeAppointment, searchEmail, createPaymentIntent} = require("../controllers/patientController");
const { userReview, getAllReviews } = require("../controllers/reviewController");
const { profile, editProfile, loginUser, registerUser, logout, isLoggedIn, getLoggedInUser, forgetPassword, getOtp, resetPassword  } = require("../controllers/userControllers");
const Authenticate = require("../middleware/Authenticate");
const router = express.Router();


router.route("/profile").get(Authenticate,profile);
router.route("/editProfile").post(Authenticate,editProfile);
router.route("/login").post(loginUser);
router.route("/register").post(registerUser)
router.route("/logout").get(logout);
router.route("/deleteApp").get(Authenticate,deleteAppointment);
router.route("/login_check").get(Authenticate,isLoggedIn)
router.route("/logedInUser").get(Authenticate,getLoggedInUser);
router.route("/forgot_password").post(forgetPassword);
router.route("/otp").post(getOtp);
router.route("/reset-password").post(resetPassword);




// PATIENT/ APPOINTMENTS ROUTES

router.route("/delList").post(Authenticate,updateStatus);
router.route("/list").get(Authenticate,patientList);
router.route("/appointment").post(Authenticate,takeAppointment);
router.route("/takeApt").get(Authenticate,completeAppointment);
router.route("/search").post(Authenticate,searchEmail);


// REVEIW ROUTES

router.route("/review").post(Authenticate,userReview);
router.route("/reviews").get(Authenticate,getAllReviews);


// PAYMENT GATEWAY
router.route("/create-payment-intent").post(Authenticate,createPaymentIntent);




module.exports = router;