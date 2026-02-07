/**
 * Script chỉ tạo lại User (Admin + User test).
 * Không xóa Hotel, Room - dùng khi đã có dữ liệu khách sạn và chỉ cần reset tài khoản đăng nhập.
 * Đăng nhập: Email + Số điện thoại (không mật khẩu).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models';

dotenv.config();

const seedUsersOnly = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    console.log('Cleared existing users');

    const admin = await User.create({
      email: 'admin@booking.com',
      fullName: 'Admin',
      phone: '0123456789',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });
    console.log('Created admin:', admin.email, '/', admin.phone);

    const user = await User.create({
      email: 'user@test.com',
      fullName: 'Nguyễn Văn A',
      phone: '0987654321',
      role: 'user',
      isEmailVerified: true,
      isActive: true,
    });
    console.log('Created user:', user.email, '/', user.phone);

    console.log('\n=== Seed users completed ===');
    console.log('Admin:  email = admin@booking.com   |  SĐT = 0123456789');
    console.log('User:   email = user@test.com      |  SĐT = 0987654321');

    process.exit(0);
  } catch (error) {
    console.error('Seed users error:', error);
    process.exit(1);
  }
};

seedUsersOnly();
