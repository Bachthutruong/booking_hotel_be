import mongoose from 'mongoose';
import { IWithdrawalRequest } from '../types';
declare const WithdrawalRequest: mongoose.Model<IWithdrawalRequest, {}, {}, {}, mongoose.Document<unknown, {}, IWithdrawalRequest, {}, mongoose.DefaultSchemaOptions> & IWithdrawalRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IWithdrawalRequest>;
export default WithdrawalRequest;
//# sourceMappingURL=WithdrawalRequest.d.ts.map