import docClient from "./config/db.js";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";

async function testConnection(){
    try {
        
        
    } catch (error) {
        console.error("AWS Connection Error:", error.message);       
    }
}

testConnection();