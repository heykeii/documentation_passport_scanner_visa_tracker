// In-memory session record counter per user.
// Tracks how many passport records each user added during their current login session.
const sessionCounts = new Map();

export function incrementRecordCount(email) {
    const current = sessionCounts.get(email) || 0;
    sessionCounts.set(email, current + 1);
}

export function getRecordCount(email) {
    return sessionCounts.get(email) || 0;
}

export function resetRecordCount(email) {
    sessionCounts.delete(email);
}
