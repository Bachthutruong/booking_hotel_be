import mongoose from 'mongoose';
import { INotification } from '../types';
declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, mongoose.DefaultSchemaOptions> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, INotification>;
export default Notification;
//# sourceMappingURL=Notification.d.ts.map