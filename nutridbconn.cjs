require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://localhost/nutribyte";

try {
    mongoose.connect(uri, { dbName: "nutribyte" }); // ✅ Specify database
    console.log("Connected to Mongodb");
    console.log("MONGO_URI:", uri);
} catch (e) {
    console.log(e);
    console.log("Mongodb connection failed");
}

module.exports = mongoose;
