const express = require("express");
const {User,Patient,PatientDetails,Reviews,UserOtp} = require("../models/userSchema");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const router = express.Router();
const Authenticate = require("../middleware/Authenticate");
const { response } = require("express");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.SECRET_KEY);



// PROFILE
exports.profile = async (req,res)=>{
    const data = await User.findOne({_id : req.rootUser._id}).populate('details').exec();
    res.send(data);
};


// EDITPROFILE
exports.editProfile =  async(req,res)=>{
    try{
        const {name,phone,address,height,weight,dob} = req.body;

        const updateUser = await User.findByIdAndUpdate({_id:req.rootUser._id},{
            $set: {
                name,
                phone,
            }
        },{
                new: true,
                useFindAndModify : false
            }
        );
        const updateDetails = await PatientDetails.updateOne({user:req.rootUser._id},{
            $set: {

                address,
                height,
                weight,
                dob

            }
        },{
                new: true,
                useFindAndModify : false
            }
        );


        res.json({
            message : "Successfully updated"
        })

    }
    catch(err){
        res.json({
            message: err
        })
        console.log("cant update profile and error is "+err);
    }
};



// LOGIN USER
exports.loginUser = async (req,res)=>{

    try{
        console.log("login")
        const {email,password} = req.body;

        if(!email || !password)
            return res.status(400).json({
                error : "empty credentials"
            })
        const userExist = await User.findOne({ email });

        if(userExist){

            const isMatch = await bcrypt.compare(password,userExist.password);
            if(isMatch){
                let token = await userExist.getJwtToken();
                res.cookie("jwtoken",token,{
                    
                    domain: "netlify.app", // Set the domain of the cookie
                    path: '/', // Set the path of the cookie
                    httpOnly: true,
                    secure: true,
                });

                // console.log("res for cookie is ", res);

                

                return res.status(200).json({
                    message : "User login successfully",
                })
                
            }
        }
        return res.status(400).json({error : "invalid credentials"});
    
    }
    catch(err){
        console.log(err);
    };
    
};

// REGISTER USER
exports.registerUser =  async (req,res)=>{

    try{
        const {name,phone,email,password,cpassword}  = req.body;
console.log(req.body)
        if(!name || !phone || !email || !password || !cpassword){
            return res.status(422).json({error : "enter empty field"});
            // return res.status(422).json({error : "enter empty field"});
        }
        const userExist = await User.findOne({email: email});
        if(userExist){
            return res.status(422).json({message : "Email already Exist"});
        }
        if(password != cpassword) return res.status(422).json({error : "password and confirm password is not same"});
    
        const user = new User({
            name,
            phone,
            email,
            password,
        })
    
        const isSaved = await user.save();
        if(isSaved) res.status(201).json({message : "User registered successfully"});
          
    }
    catch(err){
        console.log(err);
    }
     
};


// LOGOUT USER
exports.logout = (req,res) => {
    res.clearCookie('jwtoken');
    res.status(201).json({
        message : "Logged out successfully"
    })
};  






exports.isLoggedIn = async(req,res)=> {
    return res.status(200).json({
        success: true,
        message: "user is logged in already",
        
    })
};





// GET LOGGED IN USER DATA
exports.getLoggedInUser = async(req,res)=> {
    return res.status(200).json({
        user : req.rootUser
    })
};




// // Forgot password 

// function otp generate
function generateOTP() {
          
    // Declare a digits variable 
    // which stores all digits
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++ ) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

// WRITE EMAIL AND REQUEST FOR MAIL
exports.forgetPassword = async (req,res)=> {

    try{
        const {email} = req.body;
        if(!email){
            return res.status(404).json({
                message : "Enter Email"
            })
        }
        const registerUser = await User.findOne({email});
        console.log(registerUser)
        if(!registerUser){
            return res.status(404).json({
                message : "User not found"
            })
        }
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp,12);
        const otpExist = await UserOtp.findOne({user : registerUser._id});

        if(otpExist){
            const updateOtp = await UserOtp.updateOne({user: registerUser._id},{
                $set: {
                    otp : hashedOtp
                }
            },{
                    new: true,
                    useFindAndModify : false
                }
            );
        }
        else {
            const newOtp =  UserOtp({
                user : registerUser._id,
                otp : hashedOtp 
            })

            await newOtp.save();
            console.log(newOtp)
        }
       
        
        // using nodemailer for sending email
    
        const transporter = nodemailer.createTransport({
            service: 'gmail.com',
            auth:{
                user: 'nodemailer123321@gmail.com',
                pass: 'uxzaeprzbddygntw'
            }
        });
    
        const mailOptions = {
            from: 'nodemailer123321@gmail.com',
            to : email,
            subject : 'Change Password',
            text: ` Your OTP is - ${otp} and it will be valid only for 5 minutes`
        }
    
        transporter.sendMail(mailOptions, (err,info) => {
            if(err){
               
                console.log("error in nodemailer : "+err);
                res.status(500).json({
                    message : err,
                })
            }
            else {
                // console.log("Email sent to "+info.response);
                res.status(200).json({
                    message: "Reset password link has sent to your email",
                });
            }
        });
    }
    catch(err){
        res.status(500).json({
            message: err,
        })
    }
   


};


// GETTING OTP FROM FRONTEND
exports.getOtp = async (req,res) => {
    // console.log(req.body);
    const { otp,email } = req.body;

    if(!otp || !email){
        return res.status(404).json({
            message : "otp or email is not here "
        })
    }
    const registerUser = await User.findOne({email});

    if(!registerUser){
        return res.status(404).json({
            message: "User not exist (/otp)",
        });
    }

    const userOtp = await UserOtp.findOne({user : registerUser._id});
    console.log(userOtp);
    let isMatch = await bcrypt.compare(otp,userOtp.otp)
    if(!isMatch) {
        return res.status(400).json({
            message: "incorrect otp"
        })
    }

    return res.status(200).json({
        message: "Correct Otp"
    })
    
};

// UPDATING FORGET PASSWORD
exports.resetPassword = async (req,res)=> {
    try{
    const {email , pass, cpass} = req.body;
    if(pass != cpass){
        return res.status(401).json({
            message: "password and confirm password is not same"
        })
    }

    // console.log(req.body)
    const password = await bcrypt.hash(pass,12);

  
// update register password
        const updateUserPass = await User.updateOne({email},{
            $set: {
                password,
            }
        },{
                new: true,
                useFindAndModify : false
            }
        );

        // console.log(password);

        res.status(200).json({
            message: "password successfully changed",
        })
    }

    catch(err){
        console.log("errror in reset password" + err);
        res.status(400).json({
            message: `Error is ${err}`
        })
    }
    
};