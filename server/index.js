import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import docClient from "./config/db.js";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import authRoutes from './routes/authRoutes.js';
import { verifyAuth } from "./middleware/authMiddleware.js";
import passportRoutes from './routes/passportRoutes.js';
import pendingScanRoutes from './routes/pendingScanRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { startCronJobs } from './services/cronService.js';
import managementRoutes from './routes/managementRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import mobileScanRoutes from './routes/mobileScanRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/api/status', (req,res)=>{
    res.status(200).json({
        status:'Online',
        message: "Backend is running!",
        time: new Date().toISOString()
    });
});

//Listening Port
app.listen(PORT, async ()=>{
    try {
        await docClient.send(new ListTablesCommand({}));
    } catch (err) {
        // AWS connection check failed silently
    }

    startCronJobs();
})

//API Routes
app.use('/api/auth', authRoutes);
app.use('/api/passports', passportRoutes);
app.use('/api/pending-scans', pendingScanRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mobile-scan', mobileScanRoutes);

//Protected route
app.get('/api/protected', verifyAuth, (req,res)=>{
    res.json({
        message: `Welcome ${req.user.email}!`,
        user: req.user
    });
});

//Error Handler (must be after all routes)
app.use((err,req,res,next)=>{
    res.status(500).json({
        error: "Something is Wrong with the Server. Kindly checked it."
    });
});