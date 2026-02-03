import mongoose from 'mongoose';
import { IService } from '../types';
declare const Service: mongoose.Model<IService, {}, {}, {}, mongoose.Document<unknown, {}, IService, {}, mongoose.DefaultSchemaOptions> & IService & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IService>;
export default Service;
//# sourceMappingURL=Service.d.ts.map