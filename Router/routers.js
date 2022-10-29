const express = require("express");
const User = require("../models/userSchema");
const Patient = require("../models/Appointment")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const router = express.Router();
const Authenticate = require("../middleware/Authenticate");
const { response } = require("express");
const PatientEnrolled = require("../models/PatientEnrolled");
const nodemailer = require("nodemailer");

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
            return res.status(422).json({error : "enter empty field"});
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
            cpassword,
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
    const {name,phone,email,password,bloodGroup,address1,address2,city,zip,gender}  = req.body;

    if(!name || !phone || !email || !password || !bloodGroup || !address1 || !address2 || !city || !zip || !gender){
        return res.status(422).json({message: "enter empty field"});
    }
    
    

    // this thing will happen only when my email is alreday present in my enrolled collection


    if(email != req.rootUser.email){
        return res.status(401).json({
            message : " entered email and registered email should be same"
        })
    }

    // password validation

    const userLoginPassword = req.rootUser.password;

    const isMatch = await bcrypt.compare(password,userLoginPassword);
    console.log(isMatch);
    if(!isMatch) return res.status(401).json({
        message: " entered password and registered password is not same ",
    });



    // check double appointment

    const patientExist = await Patient.findOne({email});

    if(patientExist){
        return res.status(422).json({
            message: "Already taken appointment"
        })
    }

    // price decide 

    let price = 500;

    const isPatinetEnrolledBefore = await PatientEnrolled.findOne({email});

    if(isPatinetEnrolledBefore){
        price = 200;
    }



    else {
        const patient = new PatientEnrolled({
            name,phone,email,password
        });
        patient.save();
    }
      

        
















    
    
    
    
    // check if password save in user database is same or not


    const patient = new Patient({
        name,phone,email,password,bloodGroup,address1,address2,city,zip,gender,price
    });

    const isPatientSaved = patient.save();
    if(isPatientSaved) res.status(201).json({
        success: "true",
        message: "Appointment has successfully taken",
    })


   }
   catch(error){
    console.log("my error is "+error);
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




/// my email 



module.exports = router;