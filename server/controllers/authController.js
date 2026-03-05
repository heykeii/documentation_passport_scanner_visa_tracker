import { signupSchema, loginSchema } from "../schemas/authSchema.js";
import * as authService from '../services/authService.js';
import * as User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { success } from "zod";
import { getRecordCount, resetRecordCount } from '../services/sessionService.js';
import { broadcastPassportAdded } from './notificationController.js';

export async function signup(req,res){
    try {
        const validatedData = signupSchema.parse(req.body);

        const userExists = await User.exists(validatedData.email);
        if(userExists){
            return res.status(400).json({
                success:false,
                error: "Email already registered"
            });
        }

        // Hash password before embedding in the token
        const hashedPassword = await authService.hashPassword(validatedData.password);

        // Generate a 24h verification token containing the user's data
        const verificationToken = await authService.generateVerificationToken({
            email: validatedData.email,
            name: validatedData.name,
            password: hashedPassword,
            role: validatedData.role,
        });

        const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

        await sendVerificationEmail(validatedData.email, verificationLink);

        return res.status(200).json({
            success: true,
            message: "Verification email sent. Please check your inbox to activate your account."
        });

    } catch (error) {
        if (error.name === 'ZodError'){
                return res.status(400).json({
                    success: false,
                    error: (error.errors && error.errors.length > 0) ? error.errors[0].message : "Invalid input"
                });
        }

        return res.status(500).json({
            success: false,
            error: error.message || "Signup failed"
        })
    }
}

export async function verifyEmail(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: "Verification token is missing."
            });
        }

        // Decode and verify the token
        const payload = await authService.verifyVerificationToken(token);

        // Check if account was already created (e.g. user clicked link twice)
        const userExists = await User.exists(payload.email);
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: "Account already verified. Please log in."
            });
        }

        // Create the user in the database now that the email is verified
        const newUser = await User.create({
            email: payload.email,
            password: payload.password,
            name: payload.name,
            role: payload.role,
        });

        return res.status(201).json({
            success: true,
            message: "Email verified successfully! Your account is now active. You can log in."
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message || "Email verification failed."
        });
    }
}

export async function login(req,res){
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await User.findByEmail(validatedData.email)

      if (!user) {
        return res.status(401).json({
            success: false,
            error: "Invalid email or password"
        })
      }

      const passwordMatch = await authService.verifyPassword(
        validatedData.password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
            success:false,
            error: "Invalid email or password"
        });
      }


      if (!user.isActive){
        return res.status(403).json({
            success: false,
            error: "Account is not Active"
        })
      }

      await User.updateLastLogin(user.email);

      const token = await authService.generateToken(user.userID, user.email);

      return res.status(200).json({
        success: true,
        message: "User Login Successfully",
        token,
        user:{
            userId: user.userID,
            email: user.email,
            name: user.name,
            role: user.role
        }
      });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success:false,
                error: error.errors[0].message
            });
        }

        return res.status(500).json({
            success:false,
            error: error.message || "Login/Signup failed"
        })
    }
}


export async function getCurrentUser(req, res) {
    try {
        const user = await User.findByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        return res.status(200).json({
            success:true,
            user: {
                userID: user.userID,
                email: user.email,
                name: user.name,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });


    } catch (error) {
        return res.status(500).json({
            success:false,
            error: error.message || "Failed to fetch user"
        });
    }
}

export async function logout(req,res) {
    try {
        const { email, name } = req.user;
        const count = getRecordCount(email);

        // If user added records this session, notify all other staff
        if (count > 0) {
            await broadcastPassportAdded(email, name || email, count);
            resetRecordCount(email);
        }

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            error: error.message || "Logout failed"
        })
    }
}

export async function forgotPassword(req,res) {
    try {
        const {email} = req.body;

        if (!email) {
            return res.status(400).json({success: false, error: "Email is required"});
        }

        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "A reset link has been sent to your email. Please check it."
            });
        }

        const resetToken = await authService.generatePasswordResetToken(email);
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`

        await sendPasswordResetEmail(email, resetLink);

        return res.status(200).json({
            success: true,
            message: "A reset link has been sent to your email. Please check it."
        });


    } catch (error) {
        return res.status(500).json({success: false, error: error.message || "Request failed."});
    }
}


export async function resetPassword(req,res){
    try {
        const {token, password} = req.body;
        if (!token || !password) {
            return res.status(400).json({success:false, error:"Token and new password are required."})
        }

        //Validate password strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                error: "Password must be at least 8 characters, include one uppercase letter and one number."
            });
        }

        const payload = await authService.verifyPasswordResetToken(token);

        const user = await User.findByEmail(payload.email);

        if (!user) {
            return res.status(404).json({success: false, error: "User not found."})
        }

        const hashedPassword = await authService.hashPassword(password);
        await User.updatePassword(payload.email, hashedPassword);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password."
        });



    } catch (error) {
        return res.status(400).json({success: false, error: error.message || "Password reset failed."});
    }
}