const express = require("express");
const router = express.Router();
const mongoose = require("./nutridbconn.cjs");
const numberInt = require("mongoose-int32");

// Make sure that the datatypes here match with datatypes in MongoDB
const branded_food_schema = new mongoose.Schema({
    fdcId: Number,  // ✅ Updated to Number
    description: String,
    brandOwner: String,
    marketCountry: String,
    gtinUpc: String,
    ingredients: String,
    servingSize: { type: Number },
    servingSizeUnit: String,
    householdServingFullText: String,
    brandedFoodCategory: String,
    publicationDate: String
}, { collection: "branded_food" });

const Food = mongoose.model("Food", branded_food_schema);

// Test for GET request 
router.get("/hello", function (req, res) {
    res.send("<h1>Hello, Mongodb!</h1>");
});

// Search food by keyword (across multiple fields)
router.get("/food", async function (req, res) {
    try {
        const searchString = req.query.searchString || "";

        const food = await Food.find({
            $or: [
                { description: { "$regex": searchString, "$options": "i" } },
                { brandOwner: { "$regex": searchString, "$options": "i" } },
                { brandedFoodCategory: { "$regex": searchString, "$options": "i" } }
            ]
        });

        console.log("Search keyword:", searchString);
        console.log("Results found:", food.length);
        console.log("First match:", food[0]);

        if (!food || food.length === 0) {
            return res.send("<h2>No documents found</h2>");
        }

        let html = `
            <h2>Search Results for "${searchString}"</h2>
            <ul>
        `;

        food.forEach(item => {
            html += `
                <li>
                    <a href="/htmls/details.html?id=${item.fdcId?.toString()}">
                        <strong>${item.fdcId}</strong>: ${item.description}
                    </a>
                </li>
            `;
        });

        html += `</ul><br><a href="/">Search again</a>`;
        res.send(html);

    } catch (e) {
        res.status(400).send(e.message);
    }
});

// View one food item by fdcId
router.get("/food/:fdcId", async function (req, res) {
    try {
        const fdcId = parseInt(req.params.fdcId); 

        const food = await Food.findOne({ fdcId: fdcId });
        if (!food) {
            return res.status(404).send("Food not found");
        }

        res.json(food); // Return the food data as JSON
    } catch (e) {
        res.status(500).send("Error: " + e.message);
    }
});


module.exports = router;
