import mongoose from 'mongoose';
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
declare const UserAuditLog: mongoose.Model<IUserAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IUserAuditLog, {}, mongoose.DefaultSchemaOptions> & IUserAuditLog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUserAuditLog>;
export default UserAuditLog;
//# sourceMappingURL=UserAuditLog.d.ts.map