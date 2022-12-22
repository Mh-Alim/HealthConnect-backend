const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
    name: {
        
        type: String,
        required : true,
    },
    phone : {
        type: Number,
        required: true,
    },
    email : {
        type : String,
        required : true,
    },
    password:{
        type : String,
        required: true,
    },
    
    tokens: [{ token:{
        type: String,
        required : true,
    } }],

    details : { type: mongoose.Schema.Types.ObjectId, ref: 'Details' },

    Role : {
        type : String,
        default : "user"
    }
});



// appointments schema


const appointmentSchema = new mongoose.Schema({
    
    user : {type: mongoose.Schema.Types.ObjectId, ref : 'user'},
    status: {
        type: String,
        default : "na"
    },
    price : {
        type: Number,
        default : 500
    },
});

// user physical details 

const patientDetails = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref : 'user'},
    name:{
        type : String
    },
    phone:[{
        type : Number,
    }],
    bloodGroup: {
        type : String,
    },
    height:{
        type:Number,
    },
    address:{
        type:String,
    },
    Gender:{
        type: String,
    },
    weight : {
        type: Number,
    },
    dob:{
        type: String,
    },
    
    city:{
        type : String,

    },
    zip: {
        type: Number,
    },
    state: {
        type : Number,
    },
})

// reveiws schema 


const reviewSchema = new mongoose.Schema({
    
    user : {type: mongoose.Schema.Types.ObjectId, ref : 'user'},
    review : String,
    reviewRating : Number
});


// otp schema

const userOtpSchema = new mongoose.Schema({
    user : {type : mongoose.Schema.Types.ObjectId, ref : 'user'},
    otp: {
        type : String
    },
    createdAt : {
        type : Date,
        default : Date.now(),
        index: { unique: true, expires: '5m' }
    }
})

userOtpSchema.path('createdAt').index({ expires: 60 });
UserSchema.methods.getJwtToken = async function(){
    try{

        let generatedToken =  jwt.sign({_id: this._id},process.env.JWT_SECRET);
        
        this.tokens = this.tokens.concat({token:generatedToken});
        await this.save();
        return  generatedToken;
    }
    catch(err){

        console.log("err is " + err)
    }
}

UserSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,12);
        // this.cpassword = await bcrypt.hash(this.cpassword,12);
    }
})


const User = mongoose.model("user", UserSchema);
const Patient = mongoose.model("Appoitment",appointmentSchema);
const PatientDetails = mongoose.model("Details",patientDetails);
const Reviews = mongoose.model("Review",reviewSchema);
const UserOtp = mongoose.model("Otp",userOtpSchema);

module.exports = {
    User,Patient,PatientDetails,Reviews,UserOtp
};