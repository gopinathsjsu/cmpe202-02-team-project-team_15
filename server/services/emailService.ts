import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'rootuser.cmp@gmail.com';
  const emailPass = process.env.EMAIL_PASS || 'fsts rpfx vixu uogu';
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const isSecure = emailPort === 465;

  // Validate email configuration
  if (!emailPass) {
    console.warn('WARNING: EMAIL_PASS is not set. Email sending will fail.');
    console.warn('Please set EMAIL_PASS in your .env file with a Gmail App Password.');
  }

  const config: EmailConfig = {
    host: emailHost,
    port: emailPort,
    secure: isSecure,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    // Additional options for better compatibility
    tls: {
      rejectUnauthorized: false // For development only
    }
  };

  console.log('Creating email transporter with config:', {
    host: emailHost,
    port: emailPort,
    secure: isSecure,
    user: emailUser,
    hasPassword: !!emailPass
  });

  return nodemailer.createTransport(config);
};

const sendVerificationEmail = async (
  email: string,
  verificationCode: string,
  verificationLink: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verified successfully');

    const mailOptions = {
      from: `"Campus Marketplace" <${process.env.EMAIL_USER || 'rootuser.cmp@gmail.com'}>`,
      to: email,
      subject: 'Verify Your Campus Email - Campus Marketplace',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .code-box { background-color: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .verification-code { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; }
            .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Campus Marketplace</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for signing up for Campus Marketplace! Please verify your email address to complete your registration.</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280;">Your verification code:</p>
                <div class="verification-code">${verificationCode}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">This code expires in 15 minutes</p>
              </div>

              <p>Or click the button below to verify your email:</p>
              <a href="${verificationLink}" class="button">Verify Email Address</a>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                If you didn't create an account with Campus Marketplace, please ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Campus Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email Address - Campus Marketplace
        
        Your verification code is: ${verificationCode}
        This code expires in 15 minutes.
        
        Or click this link to verify: ${verificationLink}
        
        If you didn't create an account, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', {
      messageId: info.messageId,
      to: email,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return true;
  } catch (error: any) {
    console.error('Error sending verification email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      email: email
    });
    
    // Log specific error details
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check:');
      console.error('1. EMAIL_USER and EMAIL_PASS are set correctly in .env');
      console.error('2. For Gmail, use an App Password (not your regular password)');
      console.error('3. Enable "Less secure app access" or use OAuth2');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check:');
      console.error('1. EMAIL_HOST and EMAIL_PORT are correct');
      console.error('2. Your network connection');
      console.error('3. Firewall settings');
    }
    
    return false;
  }
};

const sendPasswordResetEmail = async (
  email: string,
  resetCode: string,
  resetLink: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verified successfully');

    const mailOptions = {
      from: `"Campus Marketplace" <${process.env.EMAIL_USER || 'rootuser.cmp@gmail.com'}>`,
      to: email,
      subject: 'Reset Your Password - Campus Marketplace',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .code-box { background-color: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .verification-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 8px; }
            .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Campus Marketplace</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280;">Your reset code:</p>
                <div class="verification-code">${resetCode}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">This code expires in 1 hour</p>
              </div>

              <p>Or click the button below to reset your password:</p>
              <a href="${resetLink}" class="button">Reset Password</a>

              <div class="warning">
                <p style="margin: 0; font-size: 14px; color: #991b1b;">
                  <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                This link will expire in 1 hour for security reasons.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Campus Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Password - Campus Marketplace
        
        We received a request to reset your password. If you didn't make this request, please ignore this email.
        
        Your reset code is: ${resetCode}
        This code expires in 1 hour.
        
        Or click this link to reset: ${resetLink}
        
        Security Notice: If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        This link will expire in 1 hour for security reasons.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', {
      messageId: info.messageId,
      to: email,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return true;
  } catch (error: any) {
    console.error('Error sending password reset email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      email: email
    });
    
    // Log specific error details
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check:');
      console.error('1. EMAIL_USER and EMAIL_PASS are set correctly in .env');
      console.error('2. For Gmail, use an App Password (not your regular password)');
      console.error('3. Enable "Less secure app access" or use OAuth2');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check:');
      console.error('1. EMAIL_HOST and EMAIL_PORT are correct');
      console.error('2. Your network connection');
      console.error('3. Firewall settings');
    }
    
    return false;
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
export { sendVerificationEmail, sendPasswordResetEmail };

