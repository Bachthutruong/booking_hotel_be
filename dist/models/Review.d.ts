import mongoose from 'mongoose';
import { IReview } from '../types';
declare const Review: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, mongoose.DefaultSchemaOptions> & IReview & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IReview>;
export default Review;
//# sourceMappingURL=Review.d.ts.map