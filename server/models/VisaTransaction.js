import {PutCommand, ScanCommand, DeleteCommand} from '@aws-sdk/lib-dynamodb'
import docClient from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = "VisaTransactions";

export async function create(data) {
    try {
        const transactionId = uuidv4();
        const timestamp = new Date().toISOString();

        const record = {
            transactionId,
            refNo: data.refNo || "",
            transactionType: data.transactionType || "Visa",
            agentName: data.agentName || "",
            status: data.status || "",
            numberOfPax: typeof data.numberOfPax === 'number' ? data.numberOfPax : 0,
            totalSOA: typeof data.totalSOA === 'number' ? data.totalSOA: 0,
            totalPO: typeof data.totalPO === 'number' ? data.totalPO: 0,
            netProfit: typeof data.netProfit === 'number' ? data.netProfit: 0,
            soaNumber: data.soaNumber || "",
            departureDate: data.departureDate || "",
            area: data.area || "",
            region: data.region || "Other",
            month: typeof data.month === 'number' ? data.month : null,
            year: typeof data.year === 'number' ? data.year : null,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        await docClient.send(new PutCommand({TableName: TABLE_NAME, Item: record}));
        return record;
    } catch (error) {
        throw new Error(`Failed to create transaction: ${error.message}`);
    }
}

export async function getAll() {
    try {
        const result = await docClient.send(new ScanCommand({TableName: TABLE_NAME}));
        return result.Items || [];
    } catch (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
}

export async function getByMonthYear(month, year) {
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "#m = :month AND #y = :year",
            ExpressionAttributeNames: {"#m":"month", "#y":"year"},
            ExpressionAttributeValues: {":month":month, ":year": year},
        }));
        return result.Items || [];
    } catch (error) {
        throw new Error(`Failed to fetch transactions for ${month}/${year}: ${error.message}`);
    }
}

export async function deleteByMonthYear(month, year) {
    try {
        const items = await getByMonthYear(month, year);
        await Promise.all(
            items.map(item => 
                docClient.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: {transactionId: item.transactionId},
                }))
            )
        );
        return items.length;
    } catch (error) {
        throw new Error(`Failed to delete transactions for ${month}/${year}: ${error.message}`);
    }
}

