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
    cpassword:{
        type : String,
        required : true,
    },
    tokens: [{ token:{
        type: String,
        required : true,
    } }]
});

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
        this.cpassword = await bcrypt.hash(this.cpassword,12);
    }
})


const User = mongoose.model("user", UserSchema);



module.exports = User;