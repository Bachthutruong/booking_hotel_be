import mongoose from 'mongoose';
import { IWalletTransaction } from '../types';
declare const WalletTransaction: mongoose.Model<IWalletTransaction, {}, {}, {}, mongoose.Document<unknown, {}, IWalletTransaction, {}, mongoose.DefaultSchemaOptions> & IWalletTransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IWalletTransaction>;
export default WalletTransaction;
//# sourceMappingURL=WalletTransaction.d.ts.map