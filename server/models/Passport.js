import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js";
import {v4 as uuidv4} from 'uuid';

const TABLE_NAME = "Passports";

const parseNullableInt = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
};

export async function create (data) {
    try {
        const passportId = uuidv4();
        const timestamp = new Date().toISOString();

        const record = {
            passportId,

            //Auto-filled
            surname: data.surname || "",
            firstName: data.firstName || "",
            middleName: data.middleName || "",
            dateOfBirth: data.dateOfBirth || "",
            passportNumber: data.passportNumber || "",
            dateOfIssue: data.dateOfIssue || "",
            dateOfExpiry: data.dateOfExpiry || "",

            //Always Manual
            portalRefNo: data.portalRefNo || "",

            // Manual + Group Mode
            payment: data.payment || "",
            agency: data.agency || "",
            appointmentDate: data.appointmentDate || "",
            appointmentTime: data.appointmentTime || "",
            embassy: data.embassy || "",
            departureDate: data.departureDate || "",
            tourName: data.tourName || "",
            entryMode: data.entryMode || "normal",
            migrationMonth: parseNullableInt(data.migrationMonth),
            migrationYear: parseNullableInt(data.migrationYear),

            //Meta
            createdBy: data.createdBy || "",
            createdAt: timestamp,
            updatedAt: timestamp,
           

        };

        await docClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: record,
            })
        );

        return record;

    } catch (error) {
        throw new Error(`Failed to create passport record: ${error.message}`);
    }
}


//get a single record using passport id

export async function findById(passportId) {
    try {
        const result = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {passportId},
            })
        );
        return result.Item || null;

    } catch (error) {
        throw new Error(`Failed to find record: ${error.message}`);
    }
}

//get all records
export async function getAll() {
    try {
        const result = await docClient.send(
            new ScanCommand({
                TableName: TABLE_NAME,
            })
        );
        return result.Items || [];
    } catch (error) {
        throw new Error(`Failed to fetch records: ${error.message}`)
    }
}

//update passport
export async function update(passportId, data){
    try {
        const timestamp = new Date().toISOString();

        const result = await docClient.send(
            new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { passportId },
                UpdateExpression: `SET
                    surname = :surname,
                    firstName = :firstName,
                    middleName = :middleName,
                    dateOfBirth = :dateOfBirth,
                    passportNumber = :passportNumber,
                    dateOfIssue = :dateOfIssue,
                    dateOfExpiry = :dateOfExpiry,
                    portalRefNo = :portalRefNo,
                    agency = :agency,
                    appointmentDate = :appointmentDate,
                    appointmentTime = :appointmentTime,
                    embassy = :embassy,
                    departureDate = :departureDate,
                    tourName = :tourName,
                    payment = :payment,
                    entryMode = :entryMode,
                    migrationMonth = :migrationMonth,
                    migrationYear = :migrationYear,
                    updatedAt = :updatedAt`,
                ExpressionAttributeValues: {
                    ":surname":         data.surname         || "",
                    ":firstName":       data.firstName       || "",
                    ":middleName":      data.middleName      || "",
                    ":dateOfBirth":     data.dateOfBirth     || "",
                    ":passportNumber":  data.passportNumber  || "",
                    ":dateOfIssue":     data.dateOfIssue     || "",
                    ":dateOfExpiry":    data.dateOfExpiry    || "",
                    ":portalRefNo":     data.portalRefNo     || "",
                    ":agency":          data.agency          || "",
                    ":appointmentDate": data.appointmentDate || "",
                    ":appointmentTime": data.appointmentTime || "",
                    ":embassy":         data.embassy         || "",
                    ":departureDate":   data.departureDate   || "",
                    ":tourName":        data.tourName        || "",
                    ":payment":         data.payment         || "",
                    ":entryMode":       data.entryMode       || "normal",
                    ":migrationMonth":  parseNullableInt(data.migrationMonth),
                    ":migrationYear":   parseNullableInt(data.migrationYear),
                    ":updatedAt":       timestamp,
                },
                ReturnValues: "ALL_NEW",
            })
        );
        return result.Attributes;
    } catch (error) {
        throw new Error(`Failed to update record: ${error.message}`)
    }
}

//delete passport
export async function remove(passportId){
    try {
        await docClient.send(
            new DeleteCommand({
                TableName: TABLE_NAME,
                Key: {passportId},
            })
        );
        return true;
    } catch (error) {
        throw new Error(`Failed to delete record: ${error.message}`);
    }
}

