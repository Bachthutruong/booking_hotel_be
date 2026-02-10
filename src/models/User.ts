import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'staff'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (chỉ khi có password)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method (trả về false nếu user không có password)
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Index: Cặp (email, phone) là duy nhất khi cả hai có giá trị - 1 email hoặc 1 SĐT có thể dùng nhiều tài khoản nếu cái còn lại khác
userSchema.index({ email: 1, phone: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ fullName: 'text', email: 'text', phone: 'text' });
userSchema.index({ createdAt: -1 });

const User = mongoose.model<IUser>('User', userSchema);

/** Gỡ unique index chỉ trên email (nếu có) để cho phép cùng email với số điện thoại khác = tài khoản mới. */
export async function ensureCompoundUniqueOnly(): Promise<void> {
  try {
    const indexes = await User.collection.indexes();
    const emailOnlyUnique = indexes.find(
      (idx) =>
        idx.key && (idx.key as any).email === 1 && (idx.key as any).phone === undefined && idx.unique
    );
    if (emailOnlyUnique && emailOnlyUnique.name) {
      await User.collection.dropIndex(emailOnlyUnique.name);
      console.log('[User] Dropped email-only unique index:', emailOnlyUnique.name);
    }
  } catch (e) {
    // Ignore (e.g. index not found)
  }
}

export default User;
