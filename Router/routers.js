const express = require("express");
const {User,Patient,PatientDetails,Reviews,UserOtp} = require("../models/userSchema");
// const Patient = require("../models/Appointment")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const router = express.Router();
const Authenticate = require("../middleware/Authenticate");
const { response } = require("express");
// const PatientEnrolled = require("../models/PatientEnrolled");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.SECRET_KEY);


/// learning about ref 
const {Story,Person} = require("../models/exampleSchema")
const mongoose = require("mongoose")

router.get("/",(req,res)=>{
     res.json({
        message : "home page"
    });
})


//*******************By promises (then {when promise return true} and catch {when promise retrun false})********************/


// router.post("/register",(req,res)=>{
//     const {name,phone,email,password,cpassword}  = req.body;

//     if(!name || !phone || !email || !password || !cpassword){
//         return res.status(422).json({error : "enter empty field"});
//     }
//     User.findOne({email: email}).then((userExist)=>{
//         if(userExist){
//             return res.status(422).json({error : "Email already Exist"});
//         }

//         const user = new User({
//             name,
//             phone,
//             email,
//             password,
//             cpassword 
//         })

//         user.save().then( ()=> {
//             res.status(201).json({message : "User registered successfully"});
//         }).catch((err)=> {
//             res.status(500).json({error : "Failed to register"});
//         })
//     }).catch(err => console.log(err));
// })

// "/profile" updated wrt new db schema.
router.get("/profile",Authenticate,async (req,res)=>{
    // console.log("Hello my about")

    const data = await User.findOne({_id : req.rootUser._id}).populate('details').exec();
    // console.log(data);
    res.send(data);
})


// router.get("/editProfile",Authenticate,(req,res)=>{
//     console.log("Hello my editProfile")
//     res.send(req.rootUser);
// });


router.post("/editProfile",Authenticate, async(req,res)=>{
    console.log(req.body);
    
    const {name,phone,address,height,weight,dob} = req.body;

    

    try{

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
        // console.log(updateUser);

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

    // enrolled Patient Update
    // try{

        
    //     const updateEnrolledPatient = await PatientEnrolled.updateOne({email},{
    //         $set: {
    //             name,
    //             phone,
    //         }
    //     },{
    //             new: true,
    //             useFindAndModify : false
    //         }
    //     );

    // }
    // catch(err){
    //     console.log("cant update profile and error is "+err);
    // }

    // // appointment update
    // try{

        
    //     const updateAppointment = await Patient.updateOne({email},{
    //         $set: {
    //             name,
    //             phone,
    //             address1: address,

    //         }
    //     },{
    //             new: true,
    //             useFindAndModify : false
    //         }
    //     );


    //     res.status(200).json({
    //         message: "Profile updated successfully"
    //     })

    // }
    // catch(err){
    //     console.log("cant update profile and error is "+err);
    // }
})








//*******************Async and await********************/

// UPDATED
router.post("/register", async (req,res)=>{

    try{
        const {name,phone,email,password,cpassword}  = req.body;
console.log(req.body)
        if(!name || !phone || !email || !password || !cpassword){
            return res.status(422).json({error : "enter empty field"});
            // return res.status(422).json({error : "enter empty field"});
        }
        const userExist = await User.findOne({email: email});
        console.log(userExist);
        if(userExist){
            return res.status(422).json({message : "Email already Exist"});
        }
        if(password != cpassword) return res.status(422).json({error : "password and confirm password is not same"});
        console.log("before user")
    
        const user = new User({
            name,
            phone,
            email,
            password,
            // cpassword,
        })
    
        const isSaved = await user.save();

        console.log(isSaved);
        


        console.log(isSaved);
        if(isSaved) res.status(201).json({message : "User registered successfully"});
          
    }
    catch(err){
        console.log(err);
    }
     
})


// UPDATED
router.post("/login",async (req,res)=>{

    try{
        const {email,password} = req.body;

        if(!email || !password)
            return res.status(400).json({
                error : "empty credentials"
            })
        const userExist = await User.findOne({ email });

        // console.log(` userExist is ${userExist}`);
        if(userExist){

            const isMatch = await bcrypt.compare(password,userExist.password);
            if(isMatch){
                let token = await userExist.getJwtToken();
                console.log("token is " + token);
                res.cookie("jwtoken",token,{
                });

                console.log(userExist);
                return res.status(200).json({
                    message : "User login successfully"
                })
                
            }
        }
        return res.status(400).json({error : "invalid credentials"});
    
    }
    catch(err){
        console.log(err);
    };
    
});


// UPDATED
router.post("/appointment", Authenticate , async (req,res)=>{
    

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





    // let arr = req.rootUser.appointments;
    // arr.push(appointment);
    // const updateAppointment = await User.updateOne({email},{
    //     $set: {
    //         appointments: arr,
    //         details : userDetail._id,
    //     }
    // },{
    //         new: true,
    //         useFindAndModify : false
    //     }
    // );

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

});

router.get("/takeApt",Authenticate,async(req,res) => {

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
   

})

router.get("/deleteApp",Authenticate,async(req,res)=>{
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
    
})


// UPDATED
router.get("/list", Authenticate, async (req,res) => {
    // console.log("list data ")
    const data = await Patient.find({status:"Progress"}).populate({
         path: 'user', 
         populate: { path: 'details'}
        }).exec();

    // console.log(data);
    res.status(200).send(data);
})



// Forgot password 

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
// UPDATED
router.post("/forgot_password",async (req,res)=> {

    try{
        const {email} = req.body;
        if(!email){
            return res.status(404).json({
                message : "Enter Email"
            })
        }
        console.log(email)
        const registerUser = await User.findOne({email});
        console.log(registerUser)
        if(!registerUser){
            return res.status(404).json({
                message : "User not found"
            })
        }
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp,12);
        console.log(hashedOtp);
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
       
            // console.log(updateOtp);
        
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
   


})


// UPDATED
router.post("/otp", async (req,res) => {
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
    
})

// UPDATED
router.post("/reset-password",async (req,res)=> {
    
    const {email , pass, cpass} = req.body;
    if(pass != cpass){
        return res.status(401).json({
            message: "password and confirm password is not same"
        })
    }

    // console.log(req.body)
    const password = await bcrypt.hash(pass,12);

    try{
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
    
})



// UPDATED
router.post("/review", Authenticate, async (req,res)=> {

    try{
        // const {email} = req.rootUser;
        const {review,revRating} = req.body;
        // console.log(req.body,req.rootUser._id);
        
        const user = await User.findOne({_id : req.rootUser._id}).populate('appointments').exec();
        // res.json({
        //     user
        // })
        // console.log(user);
        let totalAppointment = user.appointments.length;
        
        // console.log("total appointment is ")
        // console.log(totalAppointment);


        let takenAppointment = false;
        if(totalAppointment > 1) takenAppointment = true;
        else if(totalAppointment === 1) {
            let appointments = user.appointments;
            if(appointments[0].status === "Completed") takenAppointment = true;
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
        const newReview = new Reviews({
            user : user._id,
            review ,
            reviewRating : revRating
        })

        await newReview.save();

        return res.status(201).json({
            message : "Successfully Taken Review",
        })
        
      
        
    }
    catch(err){
        res.status(500).json({
            message: err,
        })
    }
   
})


// adjusted according to new Database schema
router.get("/reviews",async(req,res)=> {
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

})



router.post("/delList",Authenticate, async(req,res)=> {

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
})



router.get("/logedInUser",Authenticate,async(req,res)=> {
    return res.status(200).json({
        user : req.rootUser
    })
})

router.get("/logout",Authenticate, (req,res) => {
    console.log("logout call")
    res.clearCookie('jwtoken');
    console.log("after jwtoken");
    res.status(201).json({
        message : "Logged out successfully"
    })
})  


router.get("/login_check",Authenticate,(req,res)=> {
    return res.status(200).json({
        success: true,
        message: "user is logged in already",
        
    })
});


router.post("/search",Authenticate,async(req,res)=>{

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
    
})

// payment gatway using stripe => card 



  
  router.post("/create-payment-intent", async (req, res) => {
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
  });

/*
// Learning about population and ref

router.get("/ref", async (req,res)=>{

    const author = new Person({
        _id: new mongoose.Types.ObjectId(),
        name: 'baaburao',
        age: 50
    });


    author.save(function(err){
        if(err){
            console.log(err);
        }
        const story1 = new Story({
            title: 'l lg gyre',
            author: author._id  ,  // assign the _id from the person
            fans: author._id
          });
          story1.save(function (e) {
              if (err) return console.log(e);;
    author.stories.push(story1);
              author.save()
              // that's it!
            });
    });

    

    
})


router.get("/refFind",async (req,res)=>{
    // Story.findOne({title: 'Casino Royale'}).populate('author').exec(function(err,story){
    //     if(err) res.json({err});
    //     else res.json({
    //         message : `author name is ${story.author._id}`
    //     })
    // })

    // const story = await Story.findOne({ title: 'Casino Royale' }).populate('author').populate('fans');
    const story = await Story.findOne({ title: 'Making' }).populate({ path: 'fans', select: 'name' }).populate({ path: 'fans', match: { age: { $gte: 21 } },select: 'age' });;
    console.log(story.populated('author'));
    // console.log(story.populated('fans'));
    res.json({
        success : true,
        story
    })
})
router.get("/r",async (req,res)=>{
   
      
       
})
*/


// for otp test 

// router.get("/temp",async(req,res)=>{

//     try{
//         const userOtp = new UserOtp({

//         })
//     }
//     catch(err){
//         return res.json({
//             err
//         })
//     }
  
// }) 

module.exports = router;