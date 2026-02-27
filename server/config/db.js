import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from 'dotenv';

dotenv.config();

//Base Client
const client = new DynamoDBClient({
    region : process.env.AWS_REGION || 'us-east-1',
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
})

//Wrap in Document Client
const docClient = DynamoDBDocumentClient.from(client);
console.log("DynamoDB Document Client Initialized");

export default docClient;


