const express = require("express");
const {User,Patient,PatientDetails,Reviews,UserOtp} = require("../models/userSchema");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const router = express.Router();
const Authenticate = require("../middleware/Authenticate");
const { response } = require("express");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.SECRET_KEY);





// UPDATED
exports.userReview  =  async (req,res)=> {

    try{
        const {review,revRating} = req.body;
        console.log(review, revRating);
        
        const user = await User.findOne({_id : req.rootUser._id});
        console.log(user)
        let totalAppointment = 0;
        
        const totalAppointments = await Patient.find();
        let isAppointmentInProgress = false;
        for(let i = 0; i < totalAppointments.length ; i++){
        
            if(totalAppointments[i].user.toString() === req.rootUser._id.toString()) {
                totalAppointment++;
                if(totalAppointments[i].status === "Progress") isAppointmentInProgress = true;
            }
        }
        console.log(totalAppointment);
        let takenAppointment = false;
        if(totalAppointment > 1) takenAppointment = true;
        else if(totalAppointment === 1) {
  
            if(isAppointmentInProgress === false) takenAppointment = true;
            else {
                return res.status(401).json({
                    message : "Your Appointment is in Progress "
                })
            }
        }
        // console.log("reach")
        if(takenAppointment === false) {
            return  res.status(401).json({
                        message : "You havent taken any appointment yet"
                    })
        }
        
        const revs = await Reviews.find({user : req.rootUser._id});
        
        // console.log("here");
        let id = user._id;
        const newReview = new Reviews({
            user : id,
            review ,
            reviewRating : revRating
        })

        await newReview.save();

        return res.status(201).json({
            message : "Successfully Taken Review",
        })
        
      
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message: err,
        })
    }
   
};


// adjusted according to new Database schema
exports.getAllReviews = async(req,res)=> {
    try{
        const user = await Reviews.find().populate('user').exec();

        res.status(200).json({
            user
        });
    }
    catch(err){
        res.status(500).json({
            message : err,
        })
    }

};








