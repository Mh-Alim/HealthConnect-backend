const mongoose = require("mongoose");

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

const PatientEnrolled = mongoose.model("PatientEnrolled",EnrolledSchema);


module.exports = PatientEnrolled;