import mongoose from 'mongoose';
import { IRoomCategory } from '../types';
declare const RoomCategory: mongoose.Model<IRoomCategory, {}, {}, {}, mongoose.Document<unknown, {}, IRoomCategory, {}, mongoose.DefaultSchemaOptions> & IRoomCategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRoomCategory>;
export default RoomCategory;
//# sourceMappingURL=RoomCategory.d.ts.map