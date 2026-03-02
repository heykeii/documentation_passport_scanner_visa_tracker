import resend from "../config/resend.js";

export const sendVerificationEmail = async (toEmail, verificationLink) => {
    await resend.emails.send({
        from: 'Tradewings <noreply@tradewingsdocumentation.app>',
        to: toEmail,
        subject:'Verify your Tradewings Documentation Tracker Account',
        html: `
            <div style="font-family: 'Outfit', sans-serif; max-width:480px; margin: auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
                <h2 style='color: #19376D; margin-bottom: 8px;'> Verify your Email </h2>
                <p style='color:64748b; font-size: 14px;'>
                    Thanks for signing up for Tradewings Documentation Tracker.
                    Please click the button below to verify your email address and activate your account.
                </p>
                <a href="${verificationLink}" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #19376D; color: #fff; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600">
                    Verify Email
                </a>
                <p>
                    This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
                </p>   
            </div>
        
        
        `,
    });
};


export const sendPasswordResetEmail = async (toEmail, resetLink) => {
    await resend.emails.send({
        from: 'Tradewings <noreply@tradewingsdocumentation.app>',
        to: toEmail,
        subject: 'Reset your Password',
        html: `
            <div style="font-family: 'Outfit', sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
                <h2>Reset your Password</h2>
                <p style="color: #64748b; margin-bottom: 8px;">
                    We received a request to reset your Tradewings Documentation Tracker password.
                    Click the button below to choose a new password.
                </p>

                <a href="${resetLink}" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #19376D; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight:600;">
                    Reset Password
                </a>
                <p style='margin-top:24px; color: #94a3b8; font-size: 12px'>
                    This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
                </p>           
            </div>
        `,
    });
};