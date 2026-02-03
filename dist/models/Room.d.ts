import mongoose from 'mongoose';
import { IRoom } from '../types';
declare const Room: mongoose.Model<IRoom, {}, {}, {}, mongoose.Document<unknown, {}, IRoom, {}, mongoose.DefaultSchemaOptions> & IRoom & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRoom>;
export default Room;
//# sourceMappingURL=Room.d.ts.map