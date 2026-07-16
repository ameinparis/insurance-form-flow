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
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const jobs = {};
const crypto = require("crypto")
const app = express();
const PORT = process.env.PORT || 5002;
const emailTemplate = require("./emails/template");


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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


/* -------------------------- Database connect ------------------------- */
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGODB_URI in .env"); process.exit(1);
}
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => { console.error("MongoDB error", err); process.exit(1); });




/* ------------------------------- Models ------------------------------ */
// Users Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, enum: ["user", "superuser", "admin"], default: "user" },
  status: {
    type: String,
    enum: ["pending", "active", "suspended"],
    default: "pending"
  }
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

//
const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  type: {
    type: String,
    enum: ["password_setup", "password_reset"],
    required: true
  },
  email: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster lookups
tokenSchema.index({ token: 1, type: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

const Token = mongoose.model("Token", tokenSchema);

// Old schema (keep for compatibility)
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

// New schema
const newQuoteSchema = new mongoose.Schema({
  productType: {
    type: String,
    enum: ["Exclusive Annuity", "Exclusive Funeral", "Exclusive Life Assurance", "Individual Life Cover"],
    required: true
  },

  // xFlexible client field: individual OR corporate details allowed
  client: mongoose.Schema.Types.Mixed,

  // Dynamic payload → stores calculations/output from annuity or funeral models
  inputs: mongoose.Schema.Types.Mixed,
  outputs: mongoose.Schema.Types.Mixed,

  quoteId: { type: String, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  termsAndConditions: { type: String },
  medicalUnderwritingNotes: { type: String, default: "" },

}, { timestamps: true });

const Quotes = mongoose.model("Quotes", newQuoteSchema);

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userEmail: { type: String },
  userName: { type: String },
  action: {
    type: String,
    enum: [
      "USER_LOGIN",
      "USER_LOGOUT",
      "USER_CREATED",
      "QUOTE_CALCULATED",
      "QUOTE_SAVED",
      "QUOTE_DELETED",
      "USER_UPDATED",
      "PASSWORD_CHANGED",
      "PASSWORD_RESET"
    ],
    required: true
  },
  details: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

// Index for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

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
    if (err) return _res.status(401).json({ message: "Token expired or invalid" });
    req.user = payload; // { userId, role }
    next();
  });
};

/* ---------------------------- Audit Log Helper --------------------------- */
const logAudit = async ({ userId, userEmail, userName, action, details, metadata = {}, req }) => {
  try {
    const ipAddress = req?.headers["x-forwarded-for"] || req?.connection?.remoteAddress || "unknown";
    const userAgent = req?.headers["user-agent"] || "unknown";

    await AuditLog.create({
      userId,
      userEmail,
      userName,
      action,
      details,
      metadata,
      ipAddress,
      userAgent
    });
  } catch (error) {
    // Never throw - audit logging should never break the app
    console.error("Audit log error:", error.message);
  }
};




/* -------------------------- Email Helpers -------------------------- */

// Initialize SendGrid 
let sgMail;
if (process.env.SENDGRID_API_KEY) {
  sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not set. Email functionality disabled.');
}

const sendEmail = async ({ to, subject, templateData, textFallback }) => {
  if (!sgMail) return;

  const fromEmail =
    process.env.SENDGRID_FROM_EMAIL || "online@exclusivelife.co.bw";

  try {
    const html = emailTemplate(templateData);

    await sgMail.send({
      to,
      from: {
        email: fromEmail,
        name: process.env.SENDGRID_FROM_NAME || "Exclusive Life",
      },
      subject,
      html,
      text: textFallback || "",
    });
  } catch (err) {
    console.error("SendGrid email failed:", err?.response?.body || err);
    // IMPORTANT: do NOT throw
  }
};



const sendWelcomeEmail = async (email, firstName, token) => {
  const setupUrl = `${process.env.APP_URL || "http://localhost:8080"}/auth/set-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Welcome to Exclusive Life – Complete Your Account Setup",
    templateData: {
      greeting: `Hello ${firstName},`,
      message: `
        A request has been received to activate your Exclusive Life account.
      `,
      ctaText: "Set Password",
      ctaUrl: setupUrl,
      footerNote: `
        If you did not initiate this request, please contact support immediately.<br><br>
        Thank you,<br>
        Exclusive Life Team
      `,
    },
    textFallback: `Set your password: ${setupUrl}`,
  });
};

const sendPasswordChangedEmail = async (email, firstName) => {
  await sendEmail({
    to: email,
    subject: "Your Exclusive Life password was changed",
    templateData: {
      greeting: `Hello ${firstName},`,
      message: `
        This is a confirmation that your password was changed.
      `,
      footerNote: `
        If this wasn’t you, please reset your password immediately or contact support.<br><br>
        Exclusive Life Team
      `,
    },
  });
};


/** Create user (admin creates from Team screen) */
app.post("/api/users/register", authenticateToken, async (req, res) => {
  try {
    // Only superuser can create users
    if ((req.user?.role || "").toLowerCase() !== "superuser") {
      return res.status(403).json({ message: "Forbidden: superuser only" });
    }

    let { email, firstName, lastName, role } = req.body;

    // Basic required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ message: "email, firstName, lastName are required" });
    }

    // Normalize input
    email = String(email).toLowerCase().trim();
    firstName = String(firstName).trim();
    lastName = String(lastName).trim();

    // Role validation
    const allowedRoles = ["user", "superuser", "admin"];
    role = allowedRoles.includes(String(role || "").toLowerCase())
      ? String(role).toLowerCase()
      : "user";

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
    console.log(`Generated temp password for ${email}: ${tempPassword}`);

    const hash = await bcrypt.hash(tempPassword, 10);

    // Create user
    const user = await User.create({
      email,
      firstName,
      lastName,
      password: hash,
      role,
      status: "pending"
    });

    // Generate token for password setup
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Save token to database WITH userId
    await Token.create({
      userId: user._id,
      email: email.toLowerCase(),
      token,
      type: "password_setup",
      expiresAt
    });
    // Send welcome email
    let emailSent = false;
    if (process.env.SENDGRID_API_KEY) {
      const emailResult = await sendWelcomeEmail(email, firstName, token);
      emailSent = true;
      if (!emailSent) {
        console.warn(`Email sending failed for ${email}:`, emailResult.error);
      }
    } else {
      console.warn('No SENDGRID_API_KEY in .env - email not sent');
    }

    // Log user creation
    await logAudit({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "USER_CREATED",
      details: `New user ${email} created with role ${role}`,
      metadata: { newUserId: user._id, newUserEmail: email, newUserRole: role },
      req
    });

    res.status(201).json({
      message: "User created successfully" + (emailSent ? " and welcome email sent" : ""),
      emailSent,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({
      message: "Error creating user",
      error: e?.message,
      stack: e?.stack,
    });
  }
});

// Get user details for set-password screen (by token)
app.get("/api/auth/password-setup/verify", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const t = await Token.findOne({ token, type: "password_setup" });
    if (!t) return res.status(400).json({ message: "Invalid token", expired: false });

    if (t.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token expired", expired: true });
    }

    const user = await User.findById(t.userId).select("firstName lastName email status role");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      ok: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        role: user.role,
      },
    });
  } catch (e) {
    console.error("password-setup verify error:", e);
    return res.status(500).json({ message: "Failed to verify token" });
  }
});

// Set password using setup token
app.post("/api/auth/set-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const t = await Token.findOne({ token, type: "password_setup" });
    if (!t) {
      return res.status(400).json({ message: "Invalid token", expired: false });
    }

    if (t.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token expired", expired: true });
    }

    const user = await User.findById(t.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Activate user
    user.password = hash;
    user.status = "active";
    await user.save();

    // Invalidate token
    await Token.deleteOne({ _id: t._id });

    // Log initial password setup
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: "PASSWORD_CHANGED",
      details: `User ${user.email} set their initial password and activated account`,
      req
    });

    const authToken = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token: authToken,
      message: "Password set successfully"
    });

  } catch (e) {
    console.error("Set password error:", e);
    return res.status(500).json({ message: "Failed to set password" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.json({ ok: true });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await Token.create({
      userId: user._id,
      email: user.email,
      token,
      type: "password_reset",
      expiresAt,
    });

    const resetUrl = `${process.env.APP_URL || "http://localhost:8080"}/auth/reset-password?token=${token}`;

    if (sgMail) {
      await sendEmail({
        to: user.email,
        subject: "Reset your Exclusive Life password",
        templateData: {
          greeting: `Hello ${user.email},`,
          message: `
      A request has been received to change the password for your Exclusive Life account.
    `,
          ctaText: "Reset Password",
          ctaUrl: resetUrl,
          footerNote: `
      If you did not initiate this request, please contact support immediately.<br><br>
      Exclusive Life Team
    `,
        },
        textFallback: `Reset your password: ${resetUrl}`,
      });

    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("Forgot password error:", e);
    return res.json({ ok: true });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const t = await Token.findOne({ token, type: "password_reset" });
    if (!t) return res.status(400).json({ message: "Invalid token" });

    if (t.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token expired", expired: true });
    }

    const user = await User.findById(t.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash and save the new password
    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    await user.save();

    // Send password change confirmation email
    await sendPasswordChangedEmail(user.email, user.firstName);

    // Delete the used token
    await Token.deleteOne({ _id: t._id });

    // Log password reset
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: "PASSWORD_RESET",
      details: `User ${user.email} reset their password`,
      req
    });

    return res.json({ ok: true, message: "Password reset successfully" });
  } catch (e) {
    console.error("Reset password error:", e);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash and save the new password
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    // Send password change confirmation email
    await sendPasswordChangedEmail(user.email, user.firstName);

    // Log password change
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: "PASSWORD_CHANGED",
      details: `User ${user.email} changed their password`,
      req
    });

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (e) {
    console.error("Change password error:", e);
    return res.status(500).json({ message: "Failed to change password" });
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

    const token = jwt.sign({ userId: user._id.toString(), role: user.role }, JWT_SECRET);

    // Log successful login
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: "USER_LOGIN",
      details: `User ${user.email} logged in successfully`,
      req
    });

    const { password: _pw, ...safe } = user.toObject();
    res.json({ ...safe, token, userId: user._id.toString() });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Error logging in" });
  }
});

/** Me */
// app.get("/api/users/me", authenticateToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-password");
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (e) {
//     console.error("Me error:", e);
//     res.status(500).json({ message: "Error fetching user" });
//   }
// });

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

    // Log quote saved
    await logAudit({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "QUOTE_SAVED",
      details: `Legacy quote saved with ID ${quoteId}`,
      metadata: { quoteId, quote: req.body },
      req
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

/** Delete quote by id */
app.delete("/api/quotes/:id", authenticateToken, async (req, res) => {
  try {
    const q = await Quote.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ message: "Quote not found" });

    // Log quote deletion
    await logAudit({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "QUOTE_DELETED",
      details: `Legacy quote ${q.quoteId} deleted`,
      metadata: { quoteId: q.quoteId },
      req
    });

    res.json({ message: "Quote deleted successfully", id: req.params.id });
  } catch (e) {
    console.error("Delete quote error:", e);
    res.status(500).json({ message: "Failed to delete quote" });
  }
});




/** ----------------- NEW QUOTES (scalable design) ----------------- */

/** Annuity calculator proxy → Python */
app.post("/api/quotes/calculate-annuity", async (req, res) => {
  try {
    const PY_URL = process.env.PY_CALC_URL || "http://localhost:5005/annuity/calculate";
    const { data } = await axios.post(PY_URL, req.body);

    // Log quote calculation
    await logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "QUOTE_CALCULATED",
      details: `Annuity quote calculated`,
      metadata: { productType: "Exclusive Annuity", inputs: req.body },
      req
    });

    res.json(data);
  } catch (e) {
    console.error("Annuity proxy error:", e.response?.data || e.message);
    res.status(500).json({ message: "Failed to calculate annuity" });
  }
});

/** Funeral calculator proxy → Python */

app.post("/api/quotes/calculate-funeral", authenticateToken, upload.single("file"), async (req, res) => {
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
      memberNumber: row["Member Number"] || row["Member number"] || "",
      surname: row["Member Surname"] || row["Surname"] || "",
      firstName: row["First Name"] || row["Firstname"] || "",
      dob:
        row["Date of Birth"] ??
        row["DOB"] ??
        row["Dob"] ??
        row["Date of birth"] ??
        row["Date Of Birth"] ??
        "",
      relationship: row["Relationship"],
      gender: row["Gender"],
      coverAmount: parseFloat(row["Sum assured"] || row["Sum Assured"] || 0),
      premium: 0,
      age: 0,
    }));


    // Step 3: Extract form fields from body
    const inputs = req.body;

    // Step 4: Send to Python for processing
    const PY_URL = process.env.PY_CALC_URL || "http://localhost:5005/funeral/calculate";
    const { data } = await axios.post(PY_URL, { members, inputs });

    // Log quote calculation
    await logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "QUOTE_CALCULATED",
      details: `Funeral quote calculated for ${inputs.schemeName || inputs.societyName || "Unknown"}`,
      metadata: { productType: "Exclusive Funeral", memberCount: members.length, inputs },
      req
    });

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

 


/** ---------------- NEW FUNERAL JOB SYSTEM: START JOB ---------------- */
app.post("/api/quotes/funeral/start", authenticateToken, upload.single("file"), (req, res) => {
  const jobId = uuidv4();

  if (!req.file) {
    return res.status(400).json({ message: "Missing file" });
  }

  // Extract form fields (everything except file)
  const formData = req.body;

  jobs[jobId] = {
    status: "queued",
    progress: 0,
    message: "Waiting to begin calculation...",
    result: null,
    error: null,

    // Store raw data for worker
    fileBuffer: req.file.buffer,
    fileName: req.file.originalname.toLowerCase(),
    formData: formData,
  };

  console.log("Funeral job created:", jobId);

  res.json({ jobId });
});


/** ---------------- FUNERAL JOB STATUS CHECK ---------------- */
app.get("/api/quotes/funeral/status/:jobId", (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ message: "Job not found" });

  res.json(job);
});

/** ---------------- FUNERAL JOB WORKER LOOP ---------------- */
async function processFuneralJobs() {
  for (const [jobId, job] of Object.entries(jobs)) {
    if (job.status !== "queued") continue;

    console.log("Starting funeral job:", jobId);
    job.status = "processing";
    job.progress = 5;
    job.message = "Starting funeral quotation...";

    try {
      const { fileBuffer, fileName, formData } = job;
      if (!fileBuffer) {
        job.status = "error";
        job.error = "Missing file buffer";
        continue;
      }

      // ---------------- Parse File ----------------
      job.progress = 15;
      job.message = "Reading uploaded member file...";

      let rows = [];

      if (fileName.endsWith(".csv")) {
        const csv = fileBuffer.toString("utf8");
        const parsed = Papa.parse(csv, { header: true });
        rows = parsed.data.filter((r) => Object.values(r).some(Boolean));
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else {
        job.status = "error";
        job.error = "Unsupported file type";
        continue;
      }
      console.log("Parsed headers:", rows[0] ? Object.keys(rows[0]) : []);
      const headers = rows[0] ? Object.keys(rows[0]).map(h => String(h).trim()) : [];
      const hasAnyKnownHeader =
        headers.includes("Member Number") ||
        headers.includes("Member number") ||
        headers.includes("Surname") ||
        headers.includes("Member Surname") ||
        headers.includes("First Name") ||
        headers.includes("DOB") ||
        headers.includes("Date of Birth");

      if (!hasAnyKnownHeader) {
        job.status = "error";
        job.error = "Invalid template: missing header row. Please use the provided template with headers (Member Number, Surname, First Name, DOB/Date of Birth, Relationship, Gender, Sum Assured).";
        job.progress = 0;
        job.message = "Validation failed";
        continue;
      }

      job.progress = 30;
      job.message = "Validating and cleaning member data...";

      // ---------------- Map members ----------------
      const members = rows.map((row) => ({
        memberNumber: row["Member Number"] || row["Member number"] || "",
        surname: row["Member Surname"] || row["Surname"] || "",
        firstName: row["First Name"] || row["Firstname"] || "",
        dob:
          row["Date of Birth"] ??
          row["DOB"] ??
          row["Dob"] ??
          row["Date of birth"] ??
          row["Date Of Birth"] ??
          "",
        relationship: row["Relationship"],
        gender: row["Gender"],
        coverAmount: parseFloat(row["Sum assured"] || row["Sum Assured"] || 0),
        premium: 0,
        age: 0,
      }));

      // ✅ FAIL FAST: ensure DOB exists
      const missingDob = members.filter(m => !m.dob || String(m.dob).trim() === "").length;
      if (missingDob > 0) {
        job.status = "error";
        job.error = `Member file invalid: ${missingDob} members missing DOB (check headers: DOB vs Date of Birth)`;
        job.progress = 0;
        job.message = "Validation failed";
        continue;
      }

      job.progress = 50;
      job.message = "Preparing data for Excel model...";

      // ---------------- CALL PYTHON (long-running) ----------------
      job.progress = 60;
      job.message = "Running Excel pricing model...";

      // 🔁 Smooth progress while Python is working
      let smoothingTimer = setInterval(() => {
        if (job.status !== "processing") {
          clearInterval(smoothingTimer);
          return;
        }
        // creep slowly towards 95% while waiting
        if (job.progress < 95) {
          job.progress += 1;
        }
      }, 1000); // every second

      try {
        const PY_URL =
          process.env.PY_CALC_URL || "http://localhost:5005/funeral/calculate";

        // VALIDATE required form fields before Python/Excel
        const required = [
          "profitTarget",
          "societyName",
          "asAndWhenCommission",
          "schemeType",
          "maxExtendedFamilyMembers",
          "maxAgeChildren",
          "coverLevelType",
          "principalMemberCover",
        ];

        const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";
        const missing = required.filter((k) => isBlank(formData?.[k]));

        if (missing.length) {
          clearInterval(smoothingTimer);
          job.status = "error";
          job.error = `Missing required fields: ${missing.join(", ")}`;
          job.progress = 0;
          job.message = "Validation failed";
          continue;
        }

        const { data } = await axios.post(PY_URL, { members, inputs: formData });

        clearInterval(smoothingTimer);

        job.progress = 100;
        job.status = "done";
        job.message = "Calculation completed successfully";
        job.result = data.output || {};

        console.log("Funeral job completed:", jobId);
      } catch (err) {
        clearInterval(smoothingTimer);
        console.error("Worker error (Python):", err);
        job.status = "error";
        job.error = err.message || "Python calculation failed";
      }
    } catch (err) {
      console.error("Worker error:", err);
      job.status = "error";
      job.error = err.message || "Unexpected error";
    }
  }
}

setInterval(processFuneralJobs, 1000);




/** Life Assurance calculator proxy → Python */
app.post("/api/quotes/calculate-assurance", async (req, res) => {
  try {
    const PY_URL = process.env.PY_CALC_URL || "http://localhost:5005/assurance/calculate";
    const { data } = await axios.post(PY_URL, req.body);

    // Log quote calculation
    await logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "QUOTE_CALCULATED",
      details: `Life Assurance quote calculated`,
      metadata: { productType: "Exclusive Life Assurance", inputs: req.body },
      req
    });

    res.status(200).json({
      message: "Life Assurance quotation calculated successfully",
      result: data.output || {},
    });
  } catch (e) {
    console.error("Life Assurance proxy error:", e.response?.data || e.message);
    res.status(500).json({ message: "Failed to calculate Life Assurance" });
  }
});


/** Individual Life Cover calculator proxy → Python (Excel sheet) */
app.post("/api/quotes/calculate-individual-life", authenticateToken, async (req, res) => {
  try {

    const PY_URL = (process.env.PY_CALC_URL || "http://localhost:5005") + "/individual/calculate";

    const { data } = await axios.post(PY_URL, req.body, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    });

    // Log quote calculation
    await logAudit({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "QUOTE_CALCULATED",
      details: `Individual Life Cover quote calculated`,
      metadata: { productType: "Individual Life Cover", inputs: req.body },
      req
    });

    // Pass through Python result
    return res.status(200).json({
      message: "Individual Life Cover quotation calculated successfully",
      result: data.output || {},
      ok: data.ok ?? true,
    });
  } catch (e) {
    console.error("Individual Life Cover proxy error:", e.response?.data || e.message);
    return res.status(500).json({
      message: "Failed to calculate Individual Life Cover",
      error: e.response?.data || e.message,
    });
  }
});





// Create a new quote
app.post("/api/new-quotes", authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const START_NUMBER = 140;
    const start = new Date(`${now.getFullYear()}-01-01T00:00:00Z`);
    const end = new Date(`${now.getFullYear()}-12-31T23:59:59Z`);

    const count = await Quotes.countDocuments({
      createdAt: { $gte: start, $lte: end },
      quoteId: { $regex: /^EXQ-/ },
    });

    const next = String(START_NUMBER + count).padStart(4, "0");
    const quoteId = `EXQ-${next}/${yy}`;

    // ✅ Step 2: Validation logic based on productType
    const { productType, client } = req.body;

    if (productType === "Exclusive Funeral") {
      if (!client?.companyName || !client?.registrationNumber || !client?.companyEmail) {
        return res.status(400).json({
          message: "Missing companyName, registrationNumber, or companyEmail for funeral quote",
        });
      }
    } else if (productType === "Exclusive Annuity") {
      if (!client?.fullName || !client?.idNumber || !client?.email) {
        return res.status(400).json({
          message: "Missing fullName, ID number, or email for annuity quote",
        });
      }
    }

    // ✅ Step 3: Save the quote
    const quote = await Quotes.create({
      ...req.body,
      quoteId,
      createdBy: req.user.userId,
    });

    // Log quote saved
    await logAudit({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "QUOTE_SAVED",
      details: `${productType} quote saved with ID ${quoteId}`,
      metadata: { quoteId, productType, client },
      req
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

// Update notes (e.g., medical underwriting) on a quote
app.patch("/api/new-quotes/:id/notes", authenticateToken, async (req, res) => {
  try {
    const { medicalUnderwritingNotes } = req.body;
    const q = await Quotes.findByIdAndUpdate(
      req.params.id,
      { $set: { medicalUnderwritingNotes: medicalUnderwritingNotes ?? "" } },
      { new: true }
    );
    if (!q) return res.status(404).json({ message: "Quote not found" });
    res.json({ message: "Notes updated", medicalUnderwritingNotes: q.medicalUnderwritingNotes });
  } catch (e) {
    console.error("Update quote notes error:", e);
    res.status(500).json({ message: "Failed to update notes" });
  }
});

// Delete new quote
app.delete("/api/new-quotes/:id", authenticateToken, async (req, res) => {
  try {
    const q = await Quotes.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ message: "New Quote not found" });

    // Log quote deletion
    await logAudit({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "QUOTE_DELETED",
      details: `Quote ${q.quoteId} deleted`,
      metadata: { quoteId: q.quoteId, productType: q.productType },
      req
    });

    res.json({ message: "Quote deleted successfully", id: req.params.id });
  } catch (e) {
    console.error("Delete new quote error:", e);
    res.status(500).json({ message: "Failed to delete new quote" });
  }
});

// Get users

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (e) {
    console.error("Fetch users error:", e);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});


// Utility function to fetch quote by ID
async function getQuoteById(id, isLegacy = false) {
  if (isLegacy) {
    return await Quote.findById(id).lean();
  } else {
    return await Quotes.findById(id).lean();
  }
}

// Download PDF (this is for social light do not delete it)
async function renderQuoteHTML(quote) {
  // Basic HTML render — improve this later using your React structure
  const logo = "https://sociallightbw.s3.af-south-1.amazonaws.com/socialDark.png";
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Quote PDF</title>
        <link href="https://fonts.googleapis.com/css2?family=Raleway&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Raleway', sans-serif;
            font-size: 14px;
            padding: 20px;
            background: white;
          }
          .logo {
            height: 50px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 6px;
            border: 1px solid #ddd;
          }
          h2 {
            margin-top: 30px;
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <img src="${logo}" class="logo" alt="Logo" />
        <h2>Quote #${quote.quoteId}</h2>
        <p>Date: ${new Date(quote.createdAt).toLocaleDateString()}</p>
        <p><strong>Client:</strong> ${quote.client?.fullName || quote.client?.companyName}</p>
        <p><strong>Product:</strong> ${quote.productType || "Annuity"}</p>

        <h2>Inputs</h2>
        <pre>${JSON.stringify(quote.inputs || {}, null, 2)}</pre>

        <h2>Outputs</h2>
        <pre>${JSON.stringify(quote.outputs || {}, null, 2)}</pre>
      </body>
    </html>
  `;
}

app.get("/api/quotes/:id/generate-pdf", async (req, res) => {
  const { id } = req.params;
  const isLegacy = req.query.legacy === "true";

  try {
    const quote = await getQuoteById(id, isLegacy);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const html = await renderQuoteHTML(quote);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    page.on("console", msg => console.log("Page console:", msg.text()));

    await page.setContent(html, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 500)); // tiny settle

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    // 🧪 Server-side sanity log
    console.log("PDF bytes:", pdfBuffer.length, "head:", pdfBuffer.slice(0, 5).toString());

    // Preview inline while testing
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=quote-${id}.pdf`,
      "Content-Length": pdfBuffer.length,
    });
    return res.end(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({ error: "Failed to generate PDF", detail: String(err?.message || err) });
  }
});

app.post("/api/quotes/html-to-pdf", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) return res.status(400).json({ error: "Missing HTML content" });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 800)); // small delay for fonts/images

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=quote.pdf`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {
    console.error("❌ html-to-pdf failed:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});



/* ----------------------------- Audit Log API Endpoints -------------------------- */

// Get all audit logs (with optional filtering)
app.get("/api/audit-logs", authenticateToken, async (req, res) => {
  try {
    const { action, userId, startDate, endDate, limit = 100, skip = 0 } = req.query;

    const query = {};

    // Filter by action type
    if (action) {
      query.action = action;
    }

    // Filter by userId
    if (userId) {
      query.userId = userId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "firstName lastName email")
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AuditLog.countDocuments(query);

    res.json({ logs, total, limit: parseInt(limit), skip: parseInt(skip) });
  } catch (e) {
    console.error("Audit logs fetch error:", e);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// Get audit logs summary (counts by action)
app.get("/api/audit-logs/summary", authenticateToken, async (req, res) => {
  try {
    const summary = await AuditLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "firstName lastName email");

    res.json({ summary, recentLogs });
  } catch (e) {
    console.error("Audit logs summary error:", e);
    res.status(500).json({ message: "Failed to fetch audit logs summary" });
  }
});

/* ----------------------------- Start server -------------------------- */
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
