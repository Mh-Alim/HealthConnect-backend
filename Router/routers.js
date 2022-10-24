const express = require("express");
const User = require("../models/userSchema");
const Patient = require("../models/Appointment")
const bcrypt = require("bcrypt")
const router = express.Router();
const Authenticate = require("../middleware/Authenticate");
const { response } = require("express");
const PatientEnrolled = require("../models/PatientEnrolled");

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


router.get("/profile1",Authenticate,(req,res)=>{
    console.log("Hello my about")
    res.send(req.rootUser);
})
router.get("/editProfile",Authenticate,(req,res)=>{
    console.log("Hello my editProfile")
    res.send(req.rootUser);
})
//*******************Async and await********************/


router.post("/register", async (req,res)=>{

    try{
        const {name,phone,email,password,cpassword}  = req.body;

        if(!name || !phone || !email || !password || !cpassword){
            return res.status(422).json({error : "enter empty field"});
        }
        const userExist = await User.findOne({email: email});
            
        if(userExist){
            return res.status(422).json({error : "Email already Exist"});
        }
    
        const user = new User({
            name,
            phone,
            email,
            password,
            cpassword,
        })
    
        if(password != cpassword) return res.status(422).json({error : "password and confirm password is not same"});
        const isSaved = user.save();
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
        const userExist = await User.findOne({email });
        // console.log(` userExist is ${userExist}`);
        if(userExist){

            const isMatch = await bcrypt.compare(userExist.password,password);
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


router.post("/appointment" , async (req,res)=>{
    

   try{
    const {name,phone,email,password,bloodGroup,address1,address2,city,zip,gender}  = req.body;

    if(!name || !phone || !email || !password || !bloodGroup || !address1 || !address2 || !city || !zip || !gender){
        return res.status(422).json({error: "enter empty field"});
    }


    // password check if same as login password or not
    
    // const isMatch = await bcrypt.compare(req.rootUser.password,password);

    // if(!isMatch)  {
    //     return res.status(400).send("Password doesnt match");
    // }



    let price = 500;
    const PatientEnrolledBefore = await PatientEnrolled.findOne({email});
    // console.log(PatientEnrolledBefore);
    if(!PatientEnrolledBefore){
        const patient = new PatientEnrolled({
            name,phone,email,password
        });
        patient.save();
    }
    else{
        price = 200;
    }
    const patientExist = await Patient.findOne({email});
    
    if(patientExist){
        return res.status(422).json({
            error: "Already taken appointment"
        })
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


module.exports = router;