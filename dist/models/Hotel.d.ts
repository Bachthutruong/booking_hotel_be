import mongoose from 'mongoose';
import { IHotel } from '../types';
declare const Hotel: mongoose.Model<IHotel, {}, {}, {}, mongoose.Document<unknown, {}, IHotel, {}, mongoose.DefaultSchemaOptions> & IHotel & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IHotel>;
export default Hotel;
//# sourceMappingURL=Hotel.d.ts.map