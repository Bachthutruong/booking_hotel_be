import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { IUser } from '../types';

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};

export const sendTokenResponse = (
  user: IUser,
  statusCode: number,
  res: Response
): void => {
  const token = generateToken(user._id.toString());

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    data: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
    },
  });
};
