import { success } from 'zod';
import * as authService from '../services/authService.js';

export async function verifyAuth(req, res, next){
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: "Authorization header missing"
            });
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Token Missing"
            })
        }

        const payload = await authService.verifyToken(token);
        req.user = payload;
        next();

    } catch (error) {
        return res.status(403).json({
            success: false,
            error: error.message || "Invalid or expired token"
        });        
    }
}

export function requireRole(...allowedRoles){
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success:false,
                error: "User not authenticated"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: "Insufficient permissions"
            });
        }
        next();
    };
}

