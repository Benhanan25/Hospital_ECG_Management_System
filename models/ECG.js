const mongoose=require("mongoose");
const schema=new mongoose.Schema({
 patientId:{type:String,required:true,index:true},
 visitId:{type:mongoose.Schema.Types.ObjectId,ref:"Visit",default:null},
 ecgDate:{type:Date,default:Date.now},heartRate:Number,prInterval:Number,qrsDuration:Number,qtInterval:Number,
 result:{type:String,default:""},doctor:{type:String,default:""},notes:{type:String,default:""},
 fileName:{type:String,default:""},filePath:{type:String,default:""}
},{timestamps:true});
module.exports=mongoose.model("ECG",schema);