const express = require("express");
const User = require("../models/userSchema");
const bcrypt = require("bcrypt")
const router = express.Router();
const Authenticate = require("../middleware/Authenticate");

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
        
})


// login route
router.post("/login",async (req,res)=>{

    try{
        const {email,password} = req.body;

        if(!email || !password)
            return res.status(400).json({
                error : "empty credentials"
            })
    
        const userExist = await User.findOne({email : email});
        
        if(userExist){

            const isMatch = bcrypt.compare(userExist.password,password);
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


module.exports = router;