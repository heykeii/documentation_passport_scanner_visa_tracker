import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js";
import {v4 as uuidv4} from 'uuid'
import { email } from "zod";

const TABLE_NAME = 'Users';

/**
 * Create a new user
 * @param {object} userData - { email, password, name, role }
 * @returns {Promise<object>} Created user
 */

export async function create(userData){
    try {
        const userId = uuidv4();
        const timestamp = new Date().toISOString();

        const user = {
            userId: userId,
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role || 'documentation',
            createdAt: timestamp,
            updatedAt: timestamp,
            isActive: true
        };

        await docClient.send(
            new PutCommand({
                TableName : TABLE_NAME,
                Item: user
            })
        );

        return user;
    } catch (error) {
        throw new Error(`Failed to create user:${error.message}`);
    }
}

/**
 * Find user by email (primary key)
 * @param {string email} - User email
 * @returns {Promise<object|null>} - User object or null
 */

export async function findByEmail(email){
    try {
        const result = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {email}
            })
        );
        return result.Item || null;
    } catch (error) {
        throw new Error(`Failed to find user: ${error.message}`);
    }
}

/**
 * Find user by ID (global secondary index)
 * Note: Create a GSI on every userID
 * @param {string} userID
 * @returns {Promise<object|null>}
 */

export async function findById(userId){
    try {
        const result = await doc.docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'userID-index', //GSI name
                KeyConditionExpression: 'userID = :userId',
                ExpressionAttributeValues:{
                    ':userId': userId
                }
            })
        );
    } catch (error) {
        throw new Error(`Failed to find user by ID: ${error.message}`)
    }
}

/**
 * Update user last login time
 * @param {string} email - User email
 * @returns {Promise<void>}
 */

export async function updateLastLogin(email){
    try {
        await docClient.send(
            new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { email },
                UpdateExpression: 'SET lastLogin = :now, updatedAt = :now',
                ExpressionAttributeValues: {
                    ':now' : new Date().toISOString()
                }
            })
        );
    } catch (error) {
        throw new Error(`Failed to update last login:${error.message}`);
    }
}

/**
 * Check if user exists by email
 * @param {string} email - User email
 * @returns {Promise<boolean>} True if user exists
 */

export async function exists(email) {
    try {
        const user = await findByEmail(email);
        return !!user;
    } catch (error) {
        throw new Error(`Failed to check user existence: ${error.message}`);
    }
}

/**
 * Get all users (pagination optional)
 * @returns {Promise<array>} Array of users
 */

export async function getAllUsers(){
    try {
        const result = await doc.docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                Limit: 100
            })
        );
        return result.Items || [];
    } catch (error) {
        throw new Error (`Failed to get users: ${error.message}`);
    }
}