const express = require("express");
const {User,Patient,PatientDetails,Reviews,UserOtp} = require("../models/userSchema");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const router = express.Router();
const Authenticate = require("../middleware/Authenticate");
const { response } = require("express");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.SECRET_KEY);



// UPDATE STAUS IN PATIENT LIST
exports.updateStatus = async(req,res)=> {

    const { appointment_id }  = req.body;
    if(req.rootUser.Role !== "admin"){
        return res.status(401).json({
            message : "You are not authorized to delte this"
        })
    }

    const changeAptStatus = await Patient.updateOne({_id: appointment_id},{
        $set: {
            status : "Complete",
        }
    },{
            new: true,
            useFindAndModify : false
        }
    );


    return res.status(200).json({
        message : "Completed Appointment"
    })
};


// PATIENT LIST , STATUS = PROGRESS
exports.patientList =  async (req,res) => {
    const data = await Patient.find({status:"Progress"}).populate({
         path: 'user', 
         populate: { path: 'details'}
        }).exec();

    res.status(200).send(data);
};


// DELETE USER APPOINTMENT
exports.deleteAppointment =  async(req,res)=>{
    try{
        const user = req.rootUser._id;
        console.log(user);
        
        await Patient.deleteOne({user, status:"Progress"});
        console.log("deleted appointmnet")
        return res.status(200).json({
            message : "User deleted successfully",
        })
    }
    catch(err){
        console.log(err.message);
        return res.json({
            err : err.message,
        })
    }
    
};


// TAKING APPOINTMENT WITH FORM
exports.takeAppointment = async (req,res)=>{
    

   try{
    // address2 removed
    const {name,phone,email,dob,bloodGroup,address1,city,zip,gender}  = req.body;
    
    if(!name || !dob || !phone || !email || !bloodGroup || !address1 || !city || !zip || !gender){
        return res.status(422).json({message: "enter empty field"});
    }

    if(email != req.rootUser.email){
        return res.status(401).json({
            message : " entered email and registered email should be same"
        })
    }
    console.log("after")

    const totalPatient = await Patient.find({status:"Progress"});
    console.log(totalPatient);
    console.log(totalPatient.length)
    if(totalPatient.length > 50) {
        return res.status(401).json({
            message : "Tomorrows appointment is full",
            totalPatient
        })
    }
    

    const user_id = req.rootUser._id;
    // check double appointment

    const patientExist = await Patient.findOne({user: user_id,status: "Progress"});

    console.log(patientExist);
    if(patientExist){
        return res.status(422).json({
            message: "Already taken appointment"
        })
    }


    
    // price decide 

    let price = 500;
    const isPatinetEnrolledBefore = await Patient.find({user:user_id});

    if(isPatinetEnrolledBefore.length >= 1){
        price = 200;
    }

    // storing user details in PatientDetails collection 


    const detailsExist = await PatientDetails.findOne({user: user_id});
    // console.log(detailsExist)

    let userDetail;
    if(!detailsExist){
        userDetail = new PatientDetails({
       
            user: user_id,
            name,
            bloodGroup,
            city,
            zip,
            Gender: gender,
            address: address1,
            dob,
            phone,
    
        })
    
        await userDetail.save();
    }
    else {
            userDetail = await PatientDetails.updateOne({user:user_id},{
            $set: {
                name,
                bloodGroup,
                city,
                zip,
                Gender: gender,
                address: address1,
                dob,
                phone,

            }
        },{
                new: true,
                useFindAndModify : false
            }
        );
       
    }

        return res.status(201).json({
            message : "Pay Your Fee",
            user_id
        })
   }
   catch(err){
    res.json({
        err 
    })
   }

};


// ADDING APPOINTMENT IN COLLECTION 

exports.completeAppointment = async(req,res) => {

    // now taking appointment in appointment collection 
    try{
        const user_id = req.rootUser._id;
        // deciding price 
        let price = 50000;
        const isPatinetEnrolledBefore = await Patient.find({user:user_id});

        if(isPatinetEnrolledBefore.length >= 1){
            price = 20000;
        }
        price /= 100;
        console.log(user_id)
        const appointment = new Patient({
            user: user_id,
            status: "Progress",
            price
        })
    
        await appointment.save();
        console.log("successfull apt ")
        res.status(200).json({
            message : "Taken Appointment"
        })
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            err : err.message
        })
    }
   

};


// SEARCH IN LIST 



exports.searchEmail = async(req,res)=>{

    try{
        let {search_text} = req.body;
        search_text =  search_text.trim();
    
    
        const patient =  await Patient.find({status:"Progress"}).populate({
            path:'user',
            
            match: {
                $or: [
                    {email : {$regex: search_text,$options: 'i'}},
                    {name : {$regex: search_text,$options: 'i'}},
                ]
            } 
            
        }).exec();
    
        return res.status(200).json({
            success : true,
            patients : patient
        })
    }
   
    catch(err){
        return res.status(404).json({
            success : false,
            message : "Appointment email not found",
            error : err
        })
    }
    
};


// PAYMENT GATEWAY 

exports.createPaymentIntent =  async (req, res) => {
    const { id } = req.body;
    console.log(id)


    // deciding price 
    let price = 50000;
    const isPatinetEnrolledBefore = await Patient.find({user:id});

    if(isPatinetEnrolledBefore.length >= 1){
        price = 20000;
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: "inr",
      automatic_payment_methods: {
        enabled: true,
      },
    });
  
    res.send({
      clientSecret: paymentIntent.client_secret,
      price,
    });
  };



