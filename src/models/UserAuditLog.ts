import mongoose, { Schema } from 'mongoose';
import { Types } from 'mongoose';

export type UserAuditAction = 'created' | 'updated' | 'deleted';

export interface IUserAuditLog {
  _id: Types.ObjectId;
  action: UserAuditAction;
  targetUser: Types.ObjectId;
  targetUserEmail?: string;
  targetUserFullName?: string;
  targetUserRole?: string;
  performedBy: Types.ObjectId;
  performedByEmail?: string;
  performedByFullName?: string;
  details?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  createdAt: Date;
}

const userAuditLogSchema = new Schema<IUserAuditLog>(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUserEmail: String,
    targetUserFullName: String,
    targetUserRole: String,
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByEmail: String,
    performedByFullName: String,
    details: String,
    oldData: Schema.Types.Mixed,
    newData: Schema.Types.Mixed,
  },
  { timestamps: true }
);

userAuditLogSchema.index({ targetUser: 1, createdAt: -1 });
userAuditLogSchema.index({ performedBy: 1, createdAt: -1 });
userAuditLogSchema.index({ action: 1, createdAt: -1 });
userAuditLogSchema.index({ createdAt: -1 });

const UserAuditLog = mongoose.model<IUserAuditLog>('UserAuditLog', userAuditLogSchema);
export default UserAuditLog;
