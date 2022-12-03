const express = require("express");
const {User,Patient,UserDetails} = require("../models/userSchema");
// const Patient = require("../models/Appointment")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const router = express.Router();
const Authenticate = require("../middleware/Authenticate");
const { response } = require("express");
// const PatientEnrolled = require("../models/PatientEnrolled");
const nodemailer = require("nodemailer");


/// learning about ref 
const {Story,Person} = require("../models/exampleSchema")
const mongoose = require("mongoose")

router.get("/",(req,res)=>{
    res.send("Home page");
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


router.get("/profile",Authenticate,(req,res)=>{
    console.log("Hello my about")
    res.send(req.rootUser);
})
router.get("/editProfile",Authenticate,(req,res)=>{
    console.log("Hello my editProfile")
    res.send(req.rootUser);
});


router.post("/editProfile",Authenticate, async(req,res)=>{
    console.log(req.body);

    const {name,phone,email,address,height,weight,dob,id} = req.body;

    

    try{

        const updateUser = await User.findByIdAndUpdate({_id:id},{
            $set: {
                name,
                phone,
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
        console.log(updateUser);


        

    }
    catch(err){
        console.log("cant update profile and error is "+err);
    }

    // enrolled Patient Update
    try{

        
        const updateEnrolledPatient = await PatientEnrolled.updateOne({email},{
            $set: {
                name,
                phone,
            }
        },{
                new: true,
                useFindAndModify : false
            }
        );

    }
    catch(err){
        console.log("cant update profile and error is "+err);
    }

    // appointment update
    try{

        
        const updateAppointment = await Patient.updateOne({email},{
            $set: {
                name,
                phone,
                address1: address,

            }
        },{
                new: true,
                useFindAndModify : false
            }
        );


        res.status(200).json({
            message: "Profile updated successfully"
        })

    }
    catch(err){
        console.log("cant update profile and error is "+err);
    }
})








//*******************Async and await********************/


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


// login route
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
                    httpOnly : true,
                });
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

    if(isPatinetEnrolledBefore.length > 1){
        price = 200;
    }
    else if(isPatinetEnrolledBefore.length === 1){
        price = isPatinetEnrolledBefore[0].status === "Completed" ? 200 : 500;
    }


    // storing user details in userDetails collection 


    const detailsExist = await UserDetails.findOne({user: user_id});
    // console.log(detailsExist)
    if(!detailsExist){
        const userDetail = new UserDetails({
       
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
        const updateDetails = await UserDetails.updateOne({user:user_id},{
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


    // now taking appointment in appointment collection 

    const appointment = new Patient({
        user: user_id,
        status: "Progress",
        price
    })

    await appointment.save();
    let arr = req.rootUser.appointments;
    arr.push(appointment);
    const updateAppointment = await User.updateOne({email},{
        $set: {
            appointments: arr,
        }
    },{
            new: true,
            useFindAndModify : false
        }
    );

        res.status(201).json({
            message : "successfully taken appointment",
        })
   }
   catch(err){
    res.json({
        err 
    })
   }

});



router.get("/list", Authenticate, async (req,res) => {

    const data = await Patient.find();
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

router.post("/forgot_password",async (req,res)=> {

    try{
        const {email} = req.body;

        console.log(email)
        const registerUser = await User.findOne({email});
        console.log(registerUser)
        if(!registerUser){
            return res.status(404).json({
                message : "User not found"
            })
        }
        const otp = generateOTP();
       console.log(otp);
        const updateOtp = await User.updateOne({_id: registerUser._id},{
            $set: {
                otp
            }
        },{
                new: true,
                useFindAndModify : false
            }
        );
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
            text: ` Your OTP is - ${otp}`
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

router.post("/otp", async (req,res) => {
    // console.log(req.body);
    const { otp,email } = req.body;

    const user = await User.findOne({email});

    if(!user){
        return res.status(404).json({
            message: "User not exist (/otp)",
        });
    }


    if(otp !== user.otp) {
        return res.status(400).json({
            message: "incorrect otp"
        })
    }

    else if(otp === user.otp){
        return res.status(200).json({
            message: "correct otp go to reset password page"
        })
    }
})

router.post("/reset-password",async (req,res)=> {
    
    const {email , pass, cpass} = req.body;
    if(pass != cpass){
        return res.status(401).json({
            message: "password and confirm password is not same"
        })
    }

    // console.log(req.body)
    const password = await bcrypt.hash(pass,12);
    const cpassword = await bcrypt.hash(cpass,12);

    try{
// update register password
        const updateUserPass = await User.updateOne({email},{
            $set: {
                password,
                cpassword
            }
        },{
                new: true,
                useFindAndModify : false
            }
        );

        // update patient (appointment DB) password;

        const updatePatientPass = await Patient.updateOne({email},{
            $set: {
                password,
            }
        },{
                new: true,
                useFindAndModify : false
            }
        );


        // update Enrolled Patient (PateintEnrolled DB) pass

        const updateEnrolledPatinet = await PatientEnrolled.updateOne({email},{
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


router.post("/review", Authenticate, async (req,res)=> {

    try{
        const {email} = req.rootUser;
        const {review,revRating} = req.body;
        console.log(req.body);

        const userEnrolled = await PatientEnrolled.findOne({email});
        if(!userEnrolled) {
            res.status(401).json({
                message : "You have not taken any appointment yet"
            })
        }
        
        
        const updateEnrolledPatinet = await PatientEnrolled.updateOne({email},{
            $set: {
                review,
                rating:revRating,
            }
        },{
                new: true,
                useFindAndModify : false
            }
        );
        
    
        res.status(200).json({
            message: "Review Added",
            email : userEnrolled._id,
        })
    }
    catch(err){
        res.status(500).json({
            message: err,
        })
    }
   
})


router.get("/reviews",async(req,res)=> {
    try{
        const user = await PatientEnrolled.find();

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


module.exports = router;