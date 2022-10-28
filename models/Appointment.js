const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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
    },
    
});

appointmentSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,12);
    }
});


const Patient = mongoose.model("Appoitment",appointmentSchema);


module.exports = Patient;
