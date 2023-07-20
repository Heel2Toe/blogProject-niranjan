const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
var userRoute = require("./routes/users");
var managerRoute = require("./routes/managers");


const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

main().catch(err => console.log(err));
 
async function main() {
  await mongoose.connect('mongodb://127.0.0.1/blogp');
  console.log("Connected to db");
}

app.use("/", userRoute);

app.use("/managers", managerRoute);




app.listen(3000,function(req,res){
    console.log("Server running on 3000");
});