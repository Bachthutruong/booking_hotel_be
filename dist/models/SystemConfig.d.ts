import mongoose from 'mongoose';
import { ISystemConfig } from '../types';
declare const SystemConfig: mongoose.Model<ISystemConfig, {}, {}, {}, mongoose.Document<unknown, {}, ISystemConfig, {}, mongoose.DefaultSchemaOptions> & ISystemConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISystemConfig>;
export default SystemConfig;
//# sourceMappingURL=SystemConfig.d.ts.map