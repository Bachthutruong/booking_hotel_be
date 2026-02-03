import mongoose from 'mongoose';
import { IDepositRequest } from '../types';
declare const DepositRequest: mongoose.Model<IDepositRequest, {}, {}, {}, mongoose.Document<unknown, {}, IDepositRequest, {}, mongoose.DefaultSchemaOptions> & IDepositRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IDepositRequest>;
export default DepositRequest;
//# sourceMappingURL=DepositRequest.d.ts.map