import mongoose, { Schema } from 'mongoose';
import { IReview } from '../types';
import Hotel from './Hotel';

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    hotel: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel is required'],
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index
reviewSchema.index({ hotel: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ booking: 1 }, { unique: true });

// Update hotel rating after save
reviewSchema.post('save', async function () {
  await updateHotelRating(this.hotel);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await updateHotelRating(doc.hotel);
  }
});

async function updateHotelRating(hotelId: mongoose.Types.ObjectId) {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { hotel: hotelId, isApproved: true } },
    {
      $group: {
        _id: '$hotel',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Hotel.findByIdAndUpdate(hotelId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Hotel.findByIdAndUpdate(hotelId, {
      rating: 0,
      totalReviews: 0,
    });
  }
}

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
