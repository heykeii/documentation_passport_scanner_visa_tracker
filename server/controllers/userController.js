import * as User from '../models/User.js';
import * as authService from '../services/authService.js';

/* ── Update display name ── */
export async function updateName(req, res) {
    try {
        const { name } = req.body;
        if (!name || !String(name).trim())
            return res.status(400).json({ success: false, error: 'Name is required.' });

        await User.updateProfile(req.user.email, String(name).trim());
        return res.status(200).json({ success: true, message: 'Display name updated.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

/* ── Update password ── */
export async function updatePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword)
            return res.status(400).json({ success: false, error: 'Both current and new password are required.' });
        if (String(newPassword).length < 8)
            return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });

        const user = await User.findByEmail(req.user.email);
        if (!user)
            return res.status(404).json({ success: false, error: 'User not found.' });

        const match = await authService.verifyPassword(currentPassword, user.password);
        if (!match)
            return res.status(400).json({ success: false, error: 'Current password is incorrect.' });

        if (await authService.verifyPassword(newPassword, user.password))
            return res.status(400).json({ success: false, error: 'New password must be different from current password.' });

        const hashed = await authService.hashPassword(newPassword);
        await User.updatePassword(req.user.email, hashed);
        return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

/* ── Change email (partition key swap) ── */
export async function updateEmail(req, res) {
    try {
        const { newEmail, password } = req.body;

        if (!newEmail || !password)
            return res.status(400).json({ success: false, error: 'New email and current password are required.' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(newEmail).trim()))
            return res.status(400).json({ success: false, error: 'Invalid email format.' });

        const trimmedEmail = String(newEmail).trim().toLowerCase();

        // Prevent same email
        if (trimmedEmail === req.user.email.toLowerCase())
            return res.status(400).json({ success: false, error: 'New email must be different from current email.' });

        // Verify password
        const user = await User.findByEmail(req.user.email);
        if (!user)
            return res.status(404).json({ success: false, error: 'User not found.' });

        const match = await authService.verifyPassword(password, user.password);
        if (!match)
            return res.status(400).json({ success: false, error: 'Password is incorrect.' });

        // Check new email not already taken
        const existing = await User.findByEmail(trimmedEmail);
        if (existing)
            return res.status(409).json({ success: false, error: 'Email is already in use.' });

        // DynamoDB partition key swap: copy to new email → delete old
        await User.copyToNewEmail(user, trimmedEmail);
        await User.deleteByEmail(req.user.email);

        // Issue new token with new email (preserving userId)
        const token = await authService.generateToken(user.userId, trimmedEmail);
        return res.status(200).json({
            success: true,
            token,
            message: 'Email updated. Your session token has been refreshed.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
