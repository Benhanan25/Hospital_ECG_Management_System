const mongoose=require("mongoose");
const schema=new mongoose.Schema({
 patientId:{type:String,required:true,index:true},
 category:{type:String,enum:["OPD","WARD","CLINIC"],required:true},
 referenceNo:{type:String,required:true,unique:true,uppercase:true,trim:true},
 visitDate:{type:Date,default:Date.now}
},{timestamps:true});
module.exports=mongoose.model("Visit",schema);