import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = 'Notifications';

export async function create({ recipientEmail, senderEmail, senderName, type, message, quantity = null }) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const item = {
        id,
        userId: recipientEmail,
        senderEmail,
        senderName,
        type,
        message,
        quantity,
        isRead: false,
        createdAt: timestamp,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return item;
}

export async function getByUser(email) {
    const result = await docClient.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'userId-createdAt-index',
            KeyConditionExpression: 'userId = :email',
            ExpressionAttributeValues: { ':email': email },
            ScanIndexForward: false,
        })
    );
    return result.Items || [];
}

export async function markAsRead(id) {
    await docClient.send(
        new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: 'SET isRead = :true',
            ExpressionAttributeValues: { ':true': true },
        })
    );
}

export async function markAllAsRead(email) {
    const notifications = await getByUser(email);
    const unread = notifications.filter(n => !n.isRead);

    await Promise.all(
        unread.map(n =>
            docClient.send(
                new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { id: n.id },
                    UpdateExpression: 'SET isRead = :true',
                    ExpressionAttributeValues: { ':true': true },
                })
            )
        )
    );
}

export async function deleteOne(id) {
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
}

