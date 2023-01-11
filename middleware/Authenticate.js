const jwt = require("jsonwebtoken");
const {User} = require("../models/userSchema");
const router = require("../Router/routers");

const Authenticate = async (req,res,next) => {

    try{

        const token = req.cookies.jwtoken;
        const verifyToken =  jwt.verify(token,process.env.JWT_SECRET);
        // console.log(verifyToken);

        const rootUser = await User.findOne({_id: verifyToken._id , "tokens.token" : token});
        // console.log(rootUser);
        if(!rootUser) {
            throw new Error('User not f0und');

        }

        req.token = token;
        req.rootUser = rootUser;
        req.userId = rootUser._id;

        next();
    }
    catch(err){
        
        console.log(err);
        res.status(401).json({message: err});
    }

}





module.exports = Authenticate;