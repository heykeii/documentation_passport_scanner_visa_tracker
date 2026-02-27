import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import docClient from "./config/db.js";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import authRoutes from './routes/authRoutes.js'
import { verifyAuth } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

//Error Handler
app.use((err,req,res,next)=>{
    res.status(500).json({
        error: "Something is Wrong with the Server. Kindly checked it."
    });
});

//Listening Port
app.listen(PORT, async ()=>{
    console.log(`
        🚀 Server is running!
        🔗 URL: http://localhost:${PORT}
        `)

    try {
    // Send a simple command to AWS to verify credentials
    const data = await docClient.send(new ListTablesCommand({}));
    console.log("✅ AWS Connection: SUCCESS");
    
  } catch (err) {
    console.error("❌ AWS Connection: FAILED");
    console.error(`📝 Error Message: ${err.message}`);
    console.log("💡 Tip: Check your .env file for correct AWS_ACCESS_KEY_ID and REGION.");
  }
})

//API Routes
app.use('/api/auth', authRoutes);


//Protected route
app.get('/api/protected', verifyAuth, (req,res)=>{
    res.json({
        message: `Welcome ${req.user.email}!`,
        user: req.user
    });
});