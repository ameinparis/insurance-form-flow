require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Types } = require('mongoose');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { GridFSBucket } = require('mongodb');
const NodeCache = require('node-cache');
const cache = new NodeCache();
//const socket = io('http://localhost:5000');
const userSocketMap = {};
const sgMail = require('@sendgrid/mail');
const axios = require('axios');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Make sure this is in your .env

const app = express();
const PORT = process.env.PORT || 5002;
const server = http.createServer(app);
// app.use(express.json());

const { calculateLivingAnnuity } = require('./calculator');

// Set up CORS and body parsing middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});


io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    socket.on('register', async (data) => {
        const { userId } = data;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            userSocketMap[userId] = socket.id;
            console.log(`User ${userId} registered with socket ID ${socket.id}`);

            // Retrieve unread notifications from the database
            const notifications = await Notification.find({ userId: userId, read: false });
            notifications.forEach(notification => {
                socket.emit('formApprovalNeeded', notification);
            });
        } else {
            console.error(`Invalid userId: ${userId}`);
        }
    });

    socket.on('notifyApprover', async (data) => {
        console.log('Notifying approver:', data);

        const approverSocketId = userSocketMap[data.approverId];
        if (approverSocketId) {
            console.log(`Sending notification to approver ${data.approverId} with socket ID ${approverSocketId}`);
            io.to(approverSocketId).emit('formApprovalNeeded', {
                message: `New form needs approval from ${data.approverId}`,
                formDetails: data
            });
        } else {
            console.log(`Approver ${data.approverId} is not connected.`);
            const newNotification = new Notification({
                userId: data.approverId,
                message: `You have a new (${data.formDetails.formName}) form to approve`,
                notificationType: 'formApproval',
                form_type: data.formDetails.form_type,
                formId: data.formDetails.formId, // Use the formId from formDetails
            });

            newNotification.save()
                .then(notification => {
                    console.log('Notification saved:', notification);
                })
                .catch(error => {
                    console.error('Error saving notification:', error);
                });
        }
    });


    socket.on('disconnect', () => {
        console.log(`User disconnected ${socket.id}`);
        // Remove the user from userSocketMap
        for (let userId in userSocketMap) {
            if (userSocketMap[userId] === socket.id) {
                delete userSocketMap[userId];
                console.log(`User ${userId} disconnected and removed from the map.`);
                break;
            }
        }
    });
});



// MongoDB connection string
const db = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const { connection } = require('mongoose');

// Init gfs
let gfs;
mongoose.connection.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads"
    });
});

const storage = new GridFsStorage({
    url: process.env.MONGODB_URI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const { folderId } = req.params;  // Assuming folderId is sent as a route parameter
            if (!mongoose.Types.ObjectId.isValid(folderId)) {
                reject(new Error('Invalid folderId provided.'));
                return;
            }
            const filename = `${Date.now()}-any-${file.originalname}`;
            const fileInfo = {
                filename: filename,
                bucketName: 'uploads',
                metadata: {
                    folderId: new mongoose.Types.ObjectId(folderId),
                }
            };
            resolve(fileInfo);
        });
    }
});


const leaveStorage = new GridFsStorage({
    url: process.env.MONGODB_URI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return {
            filename: `${Date.now()}-leave-${file.originalname}`,
            bucketName: 'uploads',
            metadata: {
                formType: 'leave',
            }
        };
    }
});

const leaveUpload = multer({ storage: leaveStorage }).single('attachment');

// const upload = multer({ storage }).single('file');

const basicUpload = multer(); // handles form-data without files


function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}


//User login model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, required: true, default: 'user' },
});

const User = mongoose.model('User', userSchema);

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    notificationType: { type: String, required: true },
    form_type: { type: String },
    formId: { type: String, required: true },
});

const Notification = mongoose.model('Notification', notificationSchema);

const formSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formId: { type: String, required: true, unique: true },
    form_type: { type: String, required: true },
    entityNumber: { type: String, required: false },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
    data: {},
    image: { type: String },
});

formSchema.index({ formId: 1, form_type: 1 });

const Form = mongoose.model('Form', formSchema, 'forms');

// Folder model
const FolderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    entityNumber: { type: String, required: false },
    originatingFormId: { type: String, required: false },
    forms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Form' }],
    files: [{ type: mongoose.Schema.Types.ObjectId }],
    createdAt: { type: Date, default: Date.now }
});

const Folder = mongoose.model('Folder', FolderSchema, 'folders');



// Client model
const ClientSchema = new mongoose.Schema({
    entityNumber: { type: String, required: true },
    clientName: { type: String, required: true },
    createdOn: { type: Date, default: Date.now },
    idNo: { type: String, required: true },
    totalAssets: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    idExpiry: { type: Date, required: true }
});

const Client = mongoose.model('Client', ClientSchema, 'clientlist');


const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    timestamp: {
        date: { type: Date, required: true }, // Separate date field
        time: { type: String, required: true } // Separate time field
    },
    details: { type: mongoose.Schema.Types.Mixed },
    role: { type: String, required: true }, // User's role
    userEmail: { type: String, required: true } // User's email
});


const AuditLog = mongoose.model('AuditLog', auditLogSchema);
const moment = require('moment-timezone');

function logAction(user, action, role, userEmail, details = {}) {
    const timestamp = {
        date: moment().tz("Africa/Johannesburg").format('YYYY-MM-DD'),
        time: moment().tz("Africa/Johannesburg").format('HH:mm:ss')
    };

    const logEntry = new AuditLog({
        action,
        user: user._id, // Ensure user ID is being passed correctly
        userName: `${user.firstName} ${user.lastName}`,
        timestamp,
        role,
        userEmail,
        details
    });

    logEntry.save()
        .then(savedLog => {
            io.emit('new_audit_log', savedLog); // Emit to all clients
        })
        .catch(err => console.error('Error logging action:', err));
}



//middleware function that checks for the presence of a token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token is not valid' });
        req.user = user;
        next();
    });
};


// GET current authenticated user's info
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});


// Endpoint to get audit logs
app.get('/api/audit-logs', async (req, res) => {
    try {
        const auditLogs = await AuditLog.find().sort({ timestamp: -1 }); // Fetch the logs sorted by timestamp
        res.json(auditLogs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Error fetching audit logs', error });
    }
});


// POST endpoint to create a new client via form approval
app.post('/api/clientlist', async (req, res) => {
    const { entityNumber, clientName, idNo, totalAssets, status, idExpiry } = req.body;

    try {
        const clientData = {
            entityNumber,
            clientName,
            idNo,
            totalAssets,
            status,
            idExpiry,
            createdOn: new Date() // capture the date when the client is added
        };

        const newClient = new Client(clientData);
        await newClient.save();

        // Optionally, you could add logging here if needed
        // logAction(req.user, 'Create Client', {
        //     description: `Created client "${clientName}" with ID "${clientID}".`
        // });

        res.json(newClient);
    } catch (err) {
        res.status(400).json('Error: ' + err.message);
    }
});



app.post('/api/leave', authenticateToken, leaveUpload, async (req, res) => {
    try {
        console.log("REQ.BODY:", req.body);
        console.log("REQ.FILE:", req.file);

        const {
            leaveType,
            startDate,
            endDate,
            comments,
            approver
        } = req.body;

        if (!leaveType || !startDate || !endDate || !approver) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newLeave = new Leave({
            leaveType,
            startDate,
            endDate,
            comments,
            approver,
            submittedBy: req.user.userId,
            attachmentName: req.file?.filename,
            status: 'Pending',
        });

        await newLeave.save();

        const submittingUser = await User.findById(req.user.userId);
        if (!submittingUser) {
            return res.status(404).json({ message: 'Submitting user not found' });
        }

        const superusers = await User.find({ role: 'superuser' });
        if (!superusers.length) {
            return res.status(500).json({ message: 'No superuser found to notify' });
        }

        const emailsToSend = superusers.map(superuser => ({
            to: superuser.email,
            from: 'oratile@inq.co.bw',
            replyTo: submittingUser.email,
            subject: `New Leave Request from ${submittingUser.firstName} ${submittingUser.lastName}`,
            text: `${submittingUser.firstName} ${submittingUser.lastName} has submitted a ${leaveType} leave request.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2>Leave Request Notification</h2>
                    <p><strong>${submittingUser.firstName} ${submittingUser.lastName}</strong> has submitted a leave request.</p>
                    <ul>
                        <li><strong>Type:</strong> ${leaveType}</li>
                        <li><strong>Start Date:</strong> ${startDate}</li>
                        <li><strong>End Date:</strong> ${endDate}</li>
                        <li><strong>Comments:</strong> ${comments || 'None'}</li>
                    </ul>
                    <p>Please log in to review the request.</p>
                </div>
            `
        }));

        await Promise.all(emailsToSend.map(msg => sgMail.send(msg)));

        res.status(201).json({ message: 'Leave application submitted successfully', leave: newLeave });

    } catch (error) {
        console.error('Error submitting leave application:', error);
        res.status(500).json({ message: 'Failed to submit leave application', error: error.message });
    }
});


// Only fetch users with the role 'superuser'
app.get('/api/users/leave-approvers', async (req, res) => {
    try {
        const approvers = await User.find({ role: 'superuser' }).select('firstName lastName email role');
        res.json(approvers);
    } catch (error) {
        console.error('Error fetching superusers:', error);
        res.status(500).json({ message: 'Error fetching superusers' });
    }
});


//for leave list hopefully
app.get('/api/leave', async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('approver', 'firstName lastName')
            .populate('submittedBy', 'firstName lastName');

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch leave applications', error: error.message });
    }
});


app.patch('/api/leave/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });
        if (leave.submittedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending applications can be cancelled' });
        }

        leave.status = 'Cancelled';
        await leave.save();
        res.json(leave);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


app.patch('/api/leave/:id/status', authenticateToken, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Approved', 'Rejected'];

    try {
        const leave = await Leave.findById(req.params.id)
            .populate('submittedBy approver');

        if (!leave) return res.status(404).json({ message: 'Leave not found' });

        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        if (leave.status === 'Cancelled') {
            return res.status(400).json({ message: 'Cannot update a cancelled leave' });
        }

        leave.status = status;
        await leave.save();

        const msg = {
            to: leave.submittedBy.email,
            from: 'oratile@inq.co.bw',
            subject: `Your Leave Request has been ${status}`,
            text: `Hello ${leave.submittedBy.firstName}, your leave request has been ${status.toLowerCase()}.`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2>Leave Application ${status}</h2>
          <p>Hi <strong>${leave.submittedBy.firstName}</strong>,</p>
          <p>Your <strong>${leave.leaveType}</strong> leave request from <strong>${new Date(leave.startDate).toLocaleDateString()}</strong> to <strong>${new Date(leave.endDate).toLocaleDateString()}</strong> has been <strong>${status}</strong>.</p>
          <p>Reviewed by: ${leave.approver.firstName} ${leave.approver.lastName}</p>
        </div>
      `
        };

        await sgMail.send(msg);

        res.json(leave);
    } catch (err) {
        console.error('Error updating leave status or sending email:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


// GET endpoint to fetch form details by ID
app.get('/api/forms/:formId', async (req, res) => {
    const { formId } = req.params;

    if (!formId) {
        return res.status(400).json({ message: 'Form ID is required' });
    }

    try {
        const form = await Form.findOne({ formId: formId });
        if (!form) {
            return res.status(404).json({ message: `Form not found with ID: ${formId}` });
        }
        res.json(form); // Sending the form data back in response
    } catch (error) {
        console.error('Error fetching form:', error);
        res.status(500).json({ message: 'Error fetching form', error: error.message });
    }
});



// User registration endpoint
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;

        // Password validation criteria
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // Check if password meets criteria
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password does not meet criteria' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with a default role of 'user'
        const newUser = new User({
            email,
            firstName,
            lastName,
            password: hashedPassword,
            role: 'user' // Assigning a default role of 'user'
        });

        // Save user
        const savedUser = await newUser.save();

        // Log user registration
        logAction(savedUser._id, 'Register', savedUser.role, savedUser.email, {
            description: `User ${firstName} ${lastName} registered with email ${email}.`
        });

        res.status(201).json({ message: "User created successfully", user: savedUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});



// User login endpoint
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        // Validate password
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ message: 'Invalid password' });

        // Generate a token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // Token expires in 2 hours
        );

        logAction(user, 'Login', user.role, user.email, { description: 'User has logged in.' });

        // Respond with user info, token, and userId
        const { password: _, ...userInfo } = user.toObject();
        res.json({ ...userInfo, token, userId: user._id.toString() }); // Include userId in the response
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});



// Authentication middleware
const authenticateUser = (req, res, next) => {
    if (authenticated) {
        req.currentUser = {
            id: user.id,
            role: user.role,
        };
        next();
    } else {
        res.status(401).send('Not authenticated');
    }
};

//endpoint for all users retrieval
app.get('/api/users', authenticateToken, checkRole('superuser'), async (req, res) => {
    try {
        const users = await User.find({}, 'email firstName lastName role');
        res.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});


//endpoint for superuser
app.post('/api/users/:userId/assign-role', authenticateToken, async (req, res) => {
    if (req.user.role !== 'superuser') {
        return res.status(403).send('Not authorized');
    }

    const { userId } = req.params;
    const { newRole } = req.body;

    try {
        const user = await User.findById(userId);
        user.role = newRole;
        await user.save();

        // Log the role update
        logAction(req.user._id, 'Role Assignment', req.user.role, req.user.email, {
            description: `Updated role of user ${user.email} from ${oldRole} to ${newRole}.`
        });

        res.send('User role updated successfully');
    } catch (error) {
        res.status(500).send('Error updating user role');
    }
});

// middleware that checks user roles
function checkRole(role) {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            return next();
        }
        res.status(403).json({ message: 'Not authorized' });
    };
}


// Endpoint to update user role
app.patch('/api/users/:userId/role', authenticateToken, async (req, res) => {
    const { userId } = req.params;

    if (req.user.role !== 'superuser') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = "superuser"; // Hardcoding for testing
        await user.save();

        // Log the role update
        logAction(req.user._id, 'Role Update', req.user.role, user.email, {
            description: `Changed role of user ${user.email} from ${oldRole} to superuser.`
        });

        res.json({ message: `Role updated successfully to ${user.role}` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating role', error: error.message });
    }
});


// Using the middleware
app.post('/api/protected-route', checkRole('superuser'), (req, res) => {
    res.send('This is a protected route only accessible by admins.');
});

//approvers endpoint
app.get('/api/users/approvers', async (req, res) => {
    try {
        // Fetch users with the roles 'user' and 'superuser'
        const approvers = await User.find({ role: { $in: ['user', 'superuser'] } }).select('firstName lastName');
        res.json(approvers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// QUOTATIONS STUFF START HERE

//  Links to python to calculate
app.post('/api/annuity', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:5005/calculate', req.body);
        res.json(response.data);
    } catch (err) {
        console.error("Error forwarding to Python:", err.response?.data || err.message || err);
        res.status(500).json({ message: 'Failed to calculate', error: err.message });
    }
});


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
    createdAt: { type: Date, default: Date.now },
    ageAtStart: Number,
    guaranteedStartAge: Number,
    monthlyLifeAnnuity: Number,
    annualLifeAnnuity: Number,
});



const Quote = mongoose.model('Quotations', quoteSchema);

app.post("/api/save-quote", async (req, res) => {
    try {
        const now = new Date();
        const currentYear = now.getFullYear().toString().slice(-2); // e.g., "25"

        const startOfYear = new Date(`${now.getFullYear()}-01-01T00:00:00Z`);
        const endOfYear = new Date(`${now.getFullYear()}-12-31T23:59:59Z`);

        // Count quotes this year
        const count = await Quote.countDocuments({
            createdAt: { $gte: startOfYear, $lte: endOfYear }
        });

        const nextNumber = count + 1;
        const padded = String(nextNumber).padStart(4, "0");
        const generatedQuoteId = `EXQ-${padded}/${currentYear}`;

        // Save quote with generated quoteId
        const quote = new Quote({
            ...req.body,
            quoteId: generatedQuoteId,
            createdBy: req.body.createdBy,
            createdByName: req.body.createdByName,
        });

        await quote.save();

        res.status(201).json({
            message: "Quote saved successfully",
            quoteId: generatedQuoteId // Return it
        });
    } catch (err) {
        console.error("Error saving quote:", err);
        res.status(500).json({ error: "Failed to save quote" });
    }
});

// === GET /api/quotes ===
app.get("/api/quotes", async (req, res) => {
    try {
        const quotes = await Quote.find()
            .sort({ createdAt: -1 })
            .populate("createdBy", "firstName lastName")
        res.status(200).json(quotes);
    } catch (err) {
        console.error("Error fetching quotes:", err);
        res.status(500).json({ error: "Failed to fetch quotes" });
    }
});

app.get("/api/quotes/:id", async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ error: "Quote not found" });
        }
        res.status(200).json(quote);
    } catch (err) {
        console.error("Error fetching quote by ID:", err);
        res.status(500).json({ error: "Failed to fetch quote" });
    }
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
