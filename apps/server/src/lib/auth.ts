
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema/auth";
import { passwordResetEmailTemplate } from "./email-templates";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    
    
    schema: schema,
  }),
  trustedOrigins: [
    process.env.CORS_ORIGIN || "",
  ],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      // Replace the API URL with the web app URL
      const webAppUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
      const resetUrl = `${webAppUrl}/password-reset?token=${token}`;
      
      // Get email template with corrected URL
      const emailContent = passwordResetEmailTemplate(resetUrl, user.name);
      
      // For development, log the reset URL
      console.log("\n=== PASSWORD RESET REQUEST ===");
      console.log("User:", user.email);
      console.log("Reset URL:", resetUrl);
      console.log("Token:", token);
      console.log("Email Subject:", emailContent.subject);
      console.log("==============================\n");
      
      // TODO: Implement actual email sending in production
      // For now, in development, the reset URL is logged to console
      // In production, you would use an email service like:
      // - SendGrid: await sendgrid.send({ to: user.email, ...emailContent })
      // - Resend: await resend.emails.send({ to: user.email, ...emailContent })
      // - AWS SES: await ses.sendEmail({ Destination: { ToAddresses: [user.email] }, ...})
      // - Postmark: await postmark.sendEmail({ To: user.email, ...emailContent })
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});



