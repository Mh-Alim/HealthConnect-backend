const mongoose = require("mongoose");


const appointmentSchema = new mongoose.Schema({
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
    bloodGroup: {
        type: String,
        required: true,
    },
    address1:{
        type: String,
        required: true,
    },
    address2:{
        type: String,
    },
    city:{
        type: String,
        required: true,
    },
    zip: {
        type: String,
        required: true,
    },
    gender:{
        type: String,
        required: true,
    },
    price:{
        type: Number,
        required: true,
    }
});

const Patient = mongoose.model("Appoitment",appointmentSchema);


module.exports = Patient;
