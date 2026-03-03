import { PutCommand, GetCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js";
import {v4 as uuidv4} from 'uuid';

const TABLE_NAME = "PendingScans";


//save pending scan
export async function create(data){
    try {
        const scanId = uuidv4();
        const timestamp = new Date().toISOString();

        const record = {
            scanId,
            surname: data.surname || "",
            firstName: data.firstName || "",
            middleName: data.middleName || "",
            dateOfBirth: data.dateOfBirth || "",
            passportNumber: data.passportNumber || "",
            dateOfIssue: data.dateOfIssue || "",
            dateOfExpiry: data.dateOfExpiry || "",
            scannedAt: timestamp,
            status: "pending", 
        };

        await docClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: record,
            })
        );

        return record;
    } catch (error) {
        throw new Error(`Failed to save pending scan: ${error.message}`)
    }
}

//get all pending scan
export async function getAllPending(){
    try {
        const result = await docClient.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: "#s = : pending",
                ExpressionAttributeNames: {"#s": "status"},
                ExpressionAttributeValues: {":pending": "pending"},
            })
        );
        return result.Items || [];

    } catch (error) {
        throw new Error(`Failed to fetch pending scans: ${error.message}`);
    }
}

//get a single pending scan by scanId

export async function findById(scanId) {
    try {
        const result = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {scanId},
            })
        );
        return result.Item || null;

    } catch (error) {
        throw new Error(`Failed to find scan: ${error.message}`);
    }
}

//Delete a pending scan
export async function remove(scanId){
    try {
        await docClient.send(
            new DeleteCommand({
                TableName: TABLE_NAME,
                Key: {scanId},
            })
        );
        return true;
    } catch (error) {
        throw new Error(`Failed to delete pending scan: ${error.message}`)
    }
}

