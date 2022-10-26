const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const EnrolledSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
});

EnrolledSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,12);
    }
});

const PatientEnrolled = mongoose.model("PatientEnrolled",EnrolledSchema);


module.exports = PatientEnrolled;