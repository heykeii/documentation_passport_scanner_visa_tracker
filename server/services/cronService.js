import cron from 'node-cron';
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js";
import * as Notification from '../models/Notification.js';

const PASSPORT_TABLE = 'Passports';
const USER_TABLE = 'Users';

async function getAllPassports() {
    const result = await docClient.send(new ScanCommand({ TableName: PASSPORT_TABLE }));
    return result.Items || [];
}

async function getAllUsers() {
    const result = await docClient.send(new ScanCommand({ TableName: USER_TABLE }));
    return result.Items || [];
}

async function broadcastToAll(type, message) {
    const users = await getAllUsers();
    await Promise.all(
        users.map(u =>
            Notification.create({
                recipientEmail: u.email,
                senderEmail: 'system',
                senderName: 'System',
                type,
                message,
            })
        )
    );
}

async function checkPassportExpiry() {
    const passports = await getAllPassports();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    let expiringSoonCount = 0;
    let expiredCount = 0;

    for (const passport of passports) {
        if (!passport.dateOfExpiry) continue;
        const expiry = new Date(passport.dateOfExpiry);
        expiry.setHours(0, 0, 0, 0);

        if (expiry < today) {
            expiredCount++;
        } else if (expiry <= in30Days) {
            expiringSoonCount++;
        }
    }

    if (expiredCount > 0) {
        await broadcastToAll(
            'PASSPORT_EXPIRED',
            `${expiredCount} passport${expiredCount > 1 ? 's have' : ' has'} already expired.`
        );
    }

    if (expiringSoonCount > 0) {
        await broadcastToAll(
            'PASSPORT_EXPIRING_SOON',
            `${expiringSoonCount} passport${expiringSoonCount > 1 ? 's are' : ' is'} expiring within 30 days.`
        );
    }
}

async function checkUpcomingAppointments() {
    const passports = await getAllPassports();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    let upcomingCount = 0;

    for (const passport of passports) {
        if (!passport.appointmentDate) continue;
        const appt = new Date(passport.appointmentDate);
        appt.setHours(0, 0, 0, 0);

        if (appt >= today && appt <= in3Days) {
            upcomingCount++;
        }
    }

    if (upcomingCount > 0) {
        await broadcastToAll(
            'VISA_APPOINTMENT_SOON',
            `${upcomingCount} visa appointment${upcomingCount > 1 ? 's are' : ' is'} coming up within 3 days.`
        );
    }
}

export function startCronJobs() {
    // Runs every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        try {
            await checkPassportExpiry();
            await checkUpcomingAppointments();
        } catch (error) {
            // silently handle cron errors
        }
    });

}
