// server.js — Auth + Quotations only
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const Papa = require("papaparse");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 5002;

/* -------------------------- Core middleware -------------------------- */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    process.env.FRONTEND_ORIGIN,   // e.g. https://app.exclusivelife.co.bw
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* -------------------------- Database connect ------------------------- */
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGODB_URI in .env"); process.exit(1);
}
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => { console.error("MongoDB error", err); process.exit(1); });

/* ------------------------------- Models ------------------------------ */
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, enum: ["user", "superuser", "admin"], default: "user" },
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

// 🔹 Old schema (keep for compatibility)
const quoteSchema = new mongoose.Schema({
  fullName: String,
  dateOfBirth: String,
  idNumber: String,
  contactNumber: String,
  email: String,
  singlePurchasePremium: Number,
  drawdown: Number,
  guaranteedAnnuity: Number,
  fundsRemaining: Number,
  annualRetirementEstimate: Number,
  frequency: String,
  disclaimerText: String,
  quoteId: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdByName: String,
  ageAtStart: Number,
  guaranteedStartAge: Number,
  monthlyLifeAnnuity: Number,
  annualLifeAnnuity: Number,
}, { timestamps: true });
const Quote = mongoose.model("Quotations", quoteSchema);

//New schema (for scalable design)
const newQuoteSchema = new mongoose.Schema({
  productType: { type: String, enum: ["annuity", "funeral", "life"], required: true },

  client: {
    fullName: String,
    dateOfBirth: String,
    idNumber: String,
    contactNumber: String,
    email: String,
  },

  // Dynamic payload → store calculations/output based on product type
  inputs: mongoose.Schema.Types.Mixed,  
  outputs: mongoose.Schema.Types.Mixed,  

  quoteId: { type: String, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdByName: String,
}, { timestamps: true });

const Quotes = mongoose.model("Quotes", newQuoteSchema);


/* ---------------------------- Auth helpers --------------------------- */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("Missing JWT_SECRET in .env"); process.exit(1);
}

const authenticateToken = (req, _res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) return _res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return _res.status(403).json({ message: "Invalid token" });
    req.user = payload; // { userId, role }
    next();
  });
};

/* ------------------------------ Routes ------------------------------- */
// Health (optional)
app.get("/health", (_req, res) => res.send("OK"));

/** Register */
app.post("/api/users/register", async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    // basic password policy (keep if you want)
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strong.test(password)) {
      return res.status(400).json({ message: "Password must be 8+ chars with upper, lower and a number" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, firstName, lastName, password: hash, role: "user" });

    res.status(201).json({ message: "User created", user: { id: user._id, email, firstName, lastName, role: user.role } });
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ message: "Error creating user" });
  }
});

/** Login */
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ userId: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: "2h" });

    const { password: _pw, ...safe } = user.toObject();
    res.json({ ...safe, token, userId: user._id.toString() });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Error logging in" });
  }
});

/** Me */
app.get("/api/users/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    console.error("Me error:", e);
    res.status(500).json({ message: "Error fetching user" });
  }
});

/** Annuity calculator proxy → Python */
app.post("/api/annuity", async (req, res) => {
  try {
    const PY_URL = process.env.PY_CALC_URL || "http://localhost:5005/calculate";
    const { data } = await axios.post(PY_URL, req.body);
    res.json(data);
  } catch (e) {
    console.error("Annuity proxy error:", e.response?.data || e.message);
    res.status(500).json({ message: "Failed to calculate" });
  }
});

/** Create quote (formerly /api/save-quote) */
app.post("/api/quotes", authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);

    const start = new Date(`${now.getFullYear()}-01-01T00:00:00Z`);
    const end = new Date(`${now.getFullYear()}-12-31T23:59:59Z`);
    const count = await Quote.countDocuments({ createdAt: { $gte: start, $lte: end } });

    const next = String(count + 1).padStart(4, "0");
    const quoteId = `EXQ-${next}/${yy}`;

    const quote = await Quote.create({
      ...req.body,
      quoteId,
      createdBy: req.user.userId,
      createdByName: req.body.createdByName,
    });

    res.status(201).json({ message: "Quote saved", quoteId, quote });
  } catch (e) {
    console.error("Save quote error:", e);
    res.status(500).json({ message: "Failed to save quote" });
  }
});

// (compat alias if your frontend still calls /api/save-quote)
app.post("/api/save-quote", authenticateToken, async (req, res) => {
  req.url = "/api/quotes";  // forward internally
  app._router.handle(req, res, () => { });
});

/** List quotes */
app.get("/api/quotes", authenticateToken, async (_req, res) => {
  try {
    const quotes = await Quote.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName email");
    res.json(quotes);
  } catch (e) {
    console.error("List quotes error:", e);
    res.status(500).json({ message: "Failed to fetch quotes" });
  }
});

/** Get quote by id */
app.get("/api/quotes/:id", authenticateToken, async (req, res) => {
  try {
    const q = await Quote.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Quote not found" });
    res.json(q);
  } catch (e) {
    console.error("Get quote error:", e);
    res.status(500).json({ message: "Failed to fetch quote" });
  }
});

/** ----------------- NEW QUOTES (scalable design) ----------------- */

/** Annuity calculator proxy → Python */
app.post("/api/calculate-annuity", async (req, res) => {
  try {
    const PY_URL = process.env.PY_CALC_URL || "http://localhost:5005/calculate";
    const { data } = await axios.post(PY_URL, req.body);
    res.json(data);
  } catch (e) {
    console.error("Annuity proxy error:", e.response?.data || e.message);
    res.status(500).json({ message: "Failed to calculate annuity" });
  }
});

app.post("/api/quotes/funeral", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Missing file" });

    // Step 1: Parse uploaded file
    const buffer = req.file.buffer;
    const fileName = req.file.originalname.toLowerCase();

    let rows = [];
    if (fileName.endsWith(".csv")) {
      const csvText = buffer.toString("utf8");
      const parsed = Papa.parse(csvText, { header: true });
      rows = parsed.data.filter(r => Object.values(r).some(Boolean));
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    // Step 2: Map members
    const members = rows.map(row => ({
      name: `${row["First Name"]} ${row["Member Surname"]}`.trim(),
      dob: row["Date of Birth"],
      relationship: row["Relationship"],
      gender: row["Gender"],
      coverAmount: parseFloat(row["Sum assured"] || 0),
      premium: 0,
      age: 0,
    }));

    // Step 3: Extract form fields from body
    const inputs = req.body;

    // Step 4: Send to Python for processing
    const PY_URL = process.env.PY_CALC_URL || "http://localhost:5005/calculate";
    const { data } = await axios.post(PY_URL, { members, inputs });

    // Step 5: Return the result
    res.status(200).json({
      message: "Quotation calculated successfully",
      result: data.output || {},
    });

  } catch (e) {
    console.error("Funeral parse error:", e);
    res.status(500).json({ message: "Failed to process funeral quote", error: e.message });
  }
});




// Create a new quote
app.post("/api/new-quotes", authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);

    const start = new Date(`${now.getFullYear()}-01-01T00:00:00Z`);
    const end   = new Date(`${now.getFullYear()}-12-31T23:59:59Z`);
    const count = await Quotes.countDocuments({ createdAt: { $gte: start, $lte: end } });

    const next = String(count + 1).padStart(4, "0");
    const quoteId = `NEWQ-${next}/${yy}`;

    const quote = await Quotes.create({
      ...req.body,
      quoteId,
      createdBy: req.user.userId,
      createdByName: req.body.createdByName,
    });

    res.status(201).json({ message: "New Quote saved", quoteId, quote });
  } catch (e) {
    console.error("Save new quote error:", e);
    res.status(500).json({ message: "Failed to save new quote" });
  }
});

// List all new quotes
app.get("/api/new-quotes", authenticateToken, async (_req, res) => {
  try {
    const quotes = await Quotes.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName email");
    res.json(quotes);
  } catch (e) {
    console.error("List new quotes error:", e);
    res.status(500).json({ message: "Failed to fetch new quotes" });
  }
});

// Get one new quote
app.get("/api/new-quotes/:id", authenticateToken, async (req, res) => {
  try {
    const q = await Quotes.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "New Quote not found" });
    res.json(q);
  } catch (e) {
    console.error("Get new quote error:", e);
    res.status(500).json({ message: "Failed to fetch new quote" });
  }
});


app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const totalQuotes = await Quote.countDocuments();
    const totalCalculations = await Quote.countDocuments({ isCalculation: true }); // if you track that
    const revenue = await Quote.aggregate([
      { $group: { _id: null, total: { $sum: "$quotePremium" } } }
    ]);
    const successRate = 95; // Just a mock static value for now

    res.json({
      totalQuotes,
      totalCalculations,
      revenue: revenue[0]?.total || 0,
      successRate
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});


app.get('/api/dashboard/charts', authenticateToken, async (req, res) => {
  try {
    // Monthly breakdown (last 6 months)
    const monthlyData = await Quote.aggregate([
      {
        $group: {
          _id: { $substr: ["$createdAt", 0, 7] }, // YYYY-MM
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category breakdown (e.g. by productName)
    const categoryData = await Quote.aggregate([
      {
        $group: {
          _id: "$productName",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      monthlyData: monthlyData.map((d) => ({
        name: d._id,
        value: d.count
      })),
      categoryData: categoryData.map((d) => ({
        name: d._id,
        value: d.count
      }))
    });
  } catch (err) {
    console.error("Error fetching chart data:", err);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});


/* ----------------------------- Start server -------------------------- */
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
