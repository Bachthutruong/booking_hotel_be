import mongoose from 'mongoose';
import { IServiceCategory } from '../types';
declare const ServiceCategory: mongoose.Model<IServiceCategory, {}, {}, {}, mongoose.Document<unknown, {}, IServiceCategory, {}, mongoose.DefaultSchemaOptions> & IServiceCategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IServiceCategory>;
export default ServiceCategory;
//# sourceMappingURL=ServiceCategory.d.ts.map