import mongoose from 'mongoose';
import { IPromotionConfig } from '../types';
declare const PromotionConfig: mongoose.Model<IPromotionConfig, {}, {}, {}, mongoose.Document<unknown, {}, IPromotionConfig, {}, mongoose.DefaultSchemaOptions> & IPromotionConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPromotionConfig>;
export default PromotionConfig;
//# sourceMappingURL=PromotionConfig.d.ts.map