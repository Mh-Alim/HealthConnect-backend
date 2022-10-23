const mongoose = require("mongoose");

 const connection = ()=>{

  
        mongoose.connect(process.env.DB,{ useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{console.log(`mongodb successfully connected`)}).catch(err => console.log(err));
    

 }


 module.exports = connection;