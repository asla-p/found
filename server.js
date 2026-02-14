const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const lostFile = path.join(__dirname, "lost.json");
const foundFile = path.join(__dirname, "found.json");

app.use(cors());
app.use(express.json());

// Ensure JSON files exist
if (!fs.existsSync(lostFile)) fs.writeFileSync(lostFile, "[]");
if (!fs.existsSync(foundFile)) fs.writeFileSync(foundFile, "[]");

// GET Lost Items
app.get("/lost", (req, res) => {
  try {
    const data = fs.readFileSync(lostFile, "utf8");
    const lost = JSON.parse(data);
    res.json(lost);
  } catch (err) {
    res.status(500).json([]);
  }
});

// POST Lost Item (report lost)
app.post("/lost", (req, res) => {
  try {
    const lost = JSON.parse(fs.readFileSync(lostFile, "utf8"));
    const { item, colour, color, details, location } = req.body;
    const newItem = {
      item: item || "",
      color: colour || color || "",
      details: details || "",
      location: location || "",
      status: "pending"
    };
    lost.push(newItem);
    fs.writeFileSync(lostFile, JSON.stringify(lost, null, 2));
    res.json({ message: "Lost item reported successfully. We will notify you if it is found." });
  } catch (err) {
    res.status(500).json({ message: "Failed to report lost item." });
  }
});

// GET Found Items
app.get("/found", (req, res) => {
  try {
    const data = fs.readFileSync(foundFile, "utf8");
    const found = JSON.parse(data);
    res.json(found);
  } catch (err) {
    res.status(500).json([]);
  }
});

// POST Found Item (report found)
app.post("/found", (req, res) => {
  try {
    const found = JSON.parse(fs.readFileSync(foundFile, "utf8"));
    const { item, location } = req.body;
    const newItem = {
      item: item || "",
      location: location || "",
      picture: "",
      status: "pending"
    };
    found.push(newItem);
    fs.writeFileSync(foundFile, JSON.stringify(found, null, 2));
    res.json({ message: "Found item submitted successfully. Thank you for helping." });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit found item." });
  }
});

// Approve Lost Item
app.post("/admin/lost/approve", (req, res) => {
  const { index } = req.body; // index of the item in lost.json
  const lostItems = JSON.parse(fs.readFileSync(lostFile));

  if (lostItems[index]) {
    lostItems[index].status = "approved"; // add a status field
    fs.writeFileSync(lostFile, JSON.stringify(lostItems, null, 2));
    res.json({ message: "Lost item approved!" });
  } else {
    res.status(404).json({ message: "Item not found" });
  }
});

// Reject Lost Item
app.post("/admin/lost/reject", (req, res) => {
  const { index } = req.body;
  const lostItems = JSON.parse(fs.readFileSync(lostFile));

  if (lostItems[index]) {
    lostItems[index].status = "rejected";
    fs.writeFileSync(lostFile, JSON.stringify(lostItems, null, 2));
    res.json({ message: "Lost item rejected!" });
  } else {
    res.status(404).json({ message: "Item not found" });
  }
});

// Accept Found Item
app.post("/admin/found/accept", (req, res) => {
  const { index } = req.body;
  const foundItems = JSON.parse(fs.readFileSync(foundFile));

  if (foundItems[index]) {
    foundItems[index].status = "accepted";
    fs.writeFileSync(foundFile, JSON.stringify(foundItems, null, 2));
    res.json({ message: "Found item accepted!" });
  } else {
    res.status(404).json({ message: "Item not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

