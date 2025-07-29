// Email templates for authentication emails

export const passwordResetEmailTemplate = (resetUrl: string, userName?: string) => {
  return {
    subject: "Reset your password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset your password</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background-color: #000;
              color: #fff !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset your password</h2>
            <p>Hi${userName ? ` ${userName}` : ''},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <div class="footer">
              <p>Best regards,<br>Your App Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Reset your password

Hi${userName ? ` ${userName}` : ''},

We received a request to reset your password. Visit the link below to create a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
Your App Team
    `.trim()
  };
};