import { signupSchema, loginSchema } from "../schemas/authSchema.js";
import * as authService from '../services/authService.js';
import * as User from '../models/User.js';
import { email, success } from "zod";

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

        const hashedPassword = await authService.hashPassword(validatedData.password);

        const newUser = await User.create({
            email: validatedData.email,
            password: hashedPassword,
            name: validatedData.name,
            role: validatedData.role
        });

        const token = await authService.generateToken(newUser.userId, newUser.email);

        return res.status(201).json({
            success: true, message: "User registered successfully",
            token,
            user: {
                userID: newUser.userID,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });

    } catch (error) {
        if (error.name === 'ZodError'){
            return res.status(400).json({
                success: false,
                error: error.errors[0].message
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message || "Signup failed"
        })
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