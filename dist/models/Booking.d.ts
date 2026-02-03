import mongoose from 'mongoose';
import { IBooking } from '../types';
declare const Booking: mongoose.Model<IBooking, {}, {}, {}, mongoose.Document<unknown, {}, IBooking, {}, mongoose.DefaultSchemaOptions> & IBooking & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBooking>;
export default Booking;
//# sourceMappingURL=Booking.d.ts.map