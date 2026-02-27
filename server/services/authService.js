import argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-default-secret-change-in-env'
);

/**
 * Hash a plain text password using Argon2
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */

export async function hashPassword(password){
    try {
        return await argon2.hash(password,{
            type: argon2.argon2id,
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1
        })
    } catch (error) {
        throw new Error(`Password hashing failed: ${error.message}`);
    }
}

/**
 * Compare plain text password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - HASHED PASSWORD
 * @returns {Promise<boolean>} True if passwords match
 */

export async function verifyPassword(password, hash){
    try {
        return await argon2.verify(hash,password);
    } catch (error) {
        throw new Error(`Password verification failed: ${error.message}`);
    }
}

/**
 * Generate JWT TOken (Valid for 7 days)
 * @param {string} userID
 * @param {string} email
 * @returns {Promise<string>}
 */

export async function generateToken(userId, email){
    try {
        const token = await new SignJWT({ userId, email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);
        return token;
    } catch (error) {
        throw new Error(`Token generation failed: ${error.message}`);
    }
}

/**
 * @param {string} token
 * @returns {Promise<object>}
 */


export async function verifyToken(token){
    try {
        const verified = await jwtVerify(token, JWT_SECRET);
        return verified.payload;
    } catch (error) {
        throw new Error(`Token verification failed: ${error.message}`)
    }
}

/**
 * Generate refresh token (valid for 30 days)
 */

export async function generateRefreshToken(userId){
    try {
        const token = await jwtSign(
            {userId},
            JWT_SECRET,
            {algorithm: 'HS256', expiresIn: '30d'}
        );
        return token;
    } catch (error) {
        throw new Error(`Refresh token generation failed:${error.message}`)
    }
}