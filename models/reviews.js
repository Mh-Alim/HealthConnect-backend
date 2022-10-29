const mongoose = require("mongoose");


const ReviewSchmea = new mongoose.Schema({
    author: {
        type: Schema.Types.ObjectId, ref: 'PatientEnrolled'
    },
    content: String,

});


const RevRef = mongoose.model("Review",ReviewSchmea);

module.exports = RevRef;
