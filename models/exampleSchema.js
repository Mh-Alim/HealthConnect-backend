const mongoose = require("mongoose");


const { Schema } = mongoose;

const personSchema = Schema({
  _id: Schema.Types.ObjectId,
  name: String,
  age: Number,
  stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
});

const storySchema = Schema({
   
  title: String,
  otps: { 
    otp : String,
    createdAt : Date,
    expiresAt : Date,
  }
});
// storySchema.path('otps.date').index({ expires: 10 });

const Story = mongoose.model('Story', storySchema);
const Person = mongoose.model('Person', personSchema);


module.exports = {
    Story,Person
}

