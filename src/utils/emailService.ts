import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"JiudiBooking" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

// Generate 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (
  email: string,
  code: string,
  fullName: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác thực email</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #fff8f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(232, 90, 58, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #E85A3A 0%, #F59E0B 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          color: rgba(255,255,255,0.9);
          margin: 10px 0 0;
          font-size: 14px;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .greeting {
          font-size: 18px;
          color: #333;
          margin-bottom: 20px;
        }
        .message {
          color: #666;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .code-box {
          background: linear-gradient(135deg, #fff5f0 0%, #ffeee5 100%);
          border: 2px dashed #E85A3A;
          border-radius: 16px;
          padding: 25px;
          margin: 30px 0;
        }
        .code {
          font-size: 42px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #E85A3A;
          margin: 0;
        }
        .code-label {
          color: #888;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 10px;
        }
        .expire-note {
          background: #fff3cd;
          border-radius: 10px;
          padding: 15px;
          color: #856404;
          font-size: 14px;
          margin-top: 20px;
        }
        .footer {
          background: #f8f8f8;
          padding: 25px;
          text-align: center;
          color: #888;
          font-size: 12px;
        }
        .footer a {
          color: #E85A3A;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 JiudiBooking</h1>
          <p>Xác thực tài khoản của bạn</p>
        </div>
        <div class="content">
          <p class="greeting">Xin chào <strong>${fullName}</strong>! 👋</p>
          <p class="message">
            Cảm ơn bạn đã đăng ký tài khoản tại JiudiBooking. 
            Vui lòng sử dụng mã xác thực dưới đây để hoàn tất đăng ký:
          </p>
          <div class="code-box">
            <p class="code">${code}</p>
            <p class="code-label">Mã xác thực</p>
          </div>
          <div class="expire-note">
            ⏱️ Mã xác thực có hiệu lực trong <strong>10 phút</strong>
          </div>
        </div>
        <div class="footer">
          <p>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
          <p>© 2024 <a href="#">JiudiBooking</a>. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🔐 Mã xác thực đăng ký JiudiBooking',
    html,
  });
};

// Send welcome email after verification
export const sendWelcomeEmail = async (
  email: string,
  fullName: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chào mừng đến JiudiBooking</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #fff8f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(232, 90, 58, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #E85A3A 0%, #F59E0B 100%);
          padding: 50px 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 48px;
        }
        .header h2 {
          color: #ffffff;
          margin: 15px 0 0;
          font-size: 24px;
          font-weight: 400;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .message {
          color: #666;
          line-height: 1.8;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #E85A3A 0%, #F59E0B 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 15px 40px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(232, 90, 58, 0.3);
        }
        .features {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }
        .feature {
          flex: 1;
          min-width: 120px;
          text-align: center;
          padding: 15px;
        }
        .feature-icon {
          font-size: 30px;
          margin-bottom: 10px;
        }
        .feature-text {
          color: #666;
          font-size: 13px;
        }
        .footer {
          background: #f8f8f8;
          padding: 25px;
          text-align: center;
          color: #888;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉</h1>
          <h2>Chào mừng, ${fullName}!</h2>
        </div>
        <div class="content">
          <p class="message">
            Tài khoản của bạn đã được xác thực thành công! 
            Bây giờ bạn có thể khám phá hàng ngàn khách sạn, resort đẳng cấp 
            và đặt phòng với giá tốt nhất.
          </p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="cta-button">
            Bắt đầu khám phá →
          </a>
          <div class="features">
            <div class="feature">
              <div class="feature-icon">🏨</div>
              <div class="feature-text">1000+ Khách sạn</div>
            </div>
            <div class="feature">
              <div class="feature-icon">💰</div>
              <div class="feature-text">Giá tốt nhất</div>
            </div>
            <div class="feature">
              <div class="feature-icon">🎁</div>
              <div class="feature-text">Ưu đãi độc quyền</div>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 JiudiBooking. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🎉 Chào mừng bạn đến với JiudiBooking!',
    html,
  });
};
