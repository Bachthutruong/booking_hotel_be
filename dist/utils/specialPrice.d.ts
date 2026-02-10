import mongoose from 'mongoose';
import type { IRoomPriceBreakdownItem } from '../types';
export interface RoomPriceForDateResult {
    price: number;
    label: string;
    basePrice: number;
    modifierType?: 'percentage' | 'fixed';
    modifierValue?: number;
}
/**
 * Get effective room price for a single date.
 * Priority: 1) date_range rule (b), 2) weekend rule (a), 3) default base price.
 */
export declare function getEffectiveRoomPriceForDate(roomId: mongoose.Types.ObjectId, date: Date, basePrice: number): Promise<RoomPriceForDateResult>;
/**
 * Compute room price breakdown for each night (checkIn to checkOut - 1 day each).
 * Returns array of { date, price, label } and total room price.
 */
export declare function computeRoomPriceBreakdown(roomId: mongoose.Types.ObjectId, checkIn: Date, checkOut: Date, basePrice: number): Promise<{
    breakdown: IRoomPriceBreakdownItem[];
    totalRoomPrice: number;
}>;
/**
 * Get preview of room price for a date range (for frontend display before booking).
 */
export declare function getRoomPricePreview(roomId: mongoose.Types.ObjectId, checkIn: Date, checkOut: Date): Promise<{
    breakdown: IRoomPriceBreakdownItem[];
    totalRoomPrice: number;
    basePrice: number;
} | null>;
//# sourceMappingURL=specialPrice.d.ts.map