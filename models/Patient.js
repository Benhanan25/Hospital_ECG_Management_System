const mongoose=require("mongoose");
const schema=new mongoose.Schema({
 patientId:{type:String,required:true,unique:true,trim:true,uppercase:true},
 name:{type:String,required:true,trim:true},
 dob:{type:Date,required:true},age:{type:Number,required:true,min:0},
 gender:{type:String,enum:["Male","Female","Other"],required:true},
 address:{type:String,default:""},phone:{type:String,default:""}
},{timestamps:true});
schema.index({name:1,dob:1,gender:1},{unique:true});
module.exports=mongoose.model("Patient",schema);