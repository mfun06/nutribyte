const express = require("express");
const router = express.Router();
const mongoose = require("./nutridbconn.cjs");
const { Int32 } = require("mongodb"); // ✅ Use MongoDB Int32

// Schema definition
const branded_food_schema = new mongoose.Schema({
  fdcId: Number,
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

// Hello test route
router.get("/hello", function (req, res) {
  res.send("<h1>Hello, Mongodb!</h1>");
});

// Search foods
router.get("/food", async function (req, res) {
  try {
    const searchString = req.query.searchString || "";
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    const query = {
      $or: [
        { description: { "$regex": searchString, "$options": "i" } },
        { brandOwner: { "$regex": searchString, "$options": "i" } },
        { brandedFoodCategory: { "$regex": searchString, "$options": "i" } }
      ]
    };

    const totalCount = await Food.countDocuments(query);
    const food = await Food.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    let html = `...`; // Keep original HTML logic here
    res.send(html);
  } catch (e) {
    res.status(500).send("Internal Server Error: " + e.message);
  }
});

// Search food as JSON (for frontend)
router.get("/food/search-data", async function (req, res) {
  try {
    const searchString = req.query.searchString?.trim() || "";
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    if (!searchString || /[^a-zA-Z0-9\s]/.test(searchString)) {
      return res.status(400).json({ error: "Invalid search input" });
    }

    const query = { $text: { $search: searchString } };

    const totalCount = await Food.countDocuments(query);
    const food = await Food.find(query, {
      fdcId: 1,
      description: 1,
      brandOwner: 1,
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .skip((page - 1) * limit)
    .limit(limit);

    res.json({
      results: food,
      totalCount,
      page,
      limit
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Compare foods
router.get("/food/compare", async function (req, res) {
  try {
    const idsParam = req.query.ids;
    if (!idsParam) return res.status(400).send("No IDs provided");

    const idArray = idsParam.split(",").map(id => parseInt(id));
    const foods = await Food.find({ fdcId: { $in: idArray } });

    res.json(foods);
  } catch (e) {
    res.status(500).send("Error fetching comparison items: " + e.message);
  }
});

// Get food by fdcId
router.get("/food/:fdcId", async function (req, res) {
  try {
    const fdcId = parseInt(req.params.fdcId);
    const food = await Food.findOne({ fdcId: fdcId });
    if (!food) return res.status(404).send("Food not found");

    res.json(food);
  } catch (e) {
    res.status(500).send("Error: " + e.message);
  }
});

router.get("/food-nutrients/:fdcId", async function (req, res) {
    try {
      const rawId = req.params.fdcId;
      const fdcId = Int32.fromString(rawId); // ✅ 100% type match
  
      const docs = await mongoose.connection
        .collection("food_nutrients")
        .find({ fdcId })
        .toArray();
  
      console.log("Nutrient docs found:", docs);
      res.json(docs);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to retrieve nutrient data" });
    }
  });

module.exports = router;
