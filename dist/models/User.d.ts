import mongoose from 'mongoose';
import { IUser } from '../types';
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
/** Gỡ unique index chỉ trên email (nếu có) để cho phép cùng email với số điện thoại khác = tài khoản mới. */
export declare function ensureCompoundUniqueOnly(): Promise<void>;
export default User;
//# sourceMappingURL=User.d.ts.map