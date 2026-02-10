import mongoose from 'mongoose';
import { RoomSpecialPrice, Room } from '../models';
import type { IRoomPriceBreakdownItem } from '../types';

/**
 * Normalize date to YYYY-MM-DD at 00:00:00 for comparison (no timezone shift).
 */
function toDateOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Check if date is Saturday (6) or Sunday (0).
 */
function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Apply modifier to base price: percentage or fixed add.
 */
function applyModifier(
  basePrice: number,
  modifierType: 'percentage' | 'fixed',
  modifierValue: number
): number {
  if (modifierType === 'percentage') {
    return Math.round(basePrice * (1 + modifierValue / 100));
  }
  return Math.round(basePrice + modifierValue);
}

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
export async function getEffectiveRoomPriceForDate(
  roomId: mongoose.Types.ObjectId,
  date: Date,
  basePrice: number
): Promise<RoomPriceForDateResult> {
  const d = toDateOnly(date);

  // 1) Date range rules (b) - highest priority
  const dateRangeRules = await RoomSpecialPrice.find({
    rooms: roomId,
    type: 'date_range',
    isActive: true,
    startDate: { $lte: d },
    endDate: { $gte: d },
  })
    .sort({ createdAt: 1 })
    .lean();

  if (dateRangeRules.length > 0) {
    const rule = dateRangeRules[0];
    const value = rule.modifierValue ?? 0;
    const price = applyModifier(basePrice, rule.modifierType as 'percentage' | 'fixed', value);
    // Hiển thị đúng tên rule đặc biệt trong cột "Lý do"
    const label = (rule.name && String(rule.name).trim()) || 'Rule theo khoảng ngày';
    return {
      price,
      label,
      basePrice,
      modifierType: rule.modifierType as 'percentage' | 'fixed',
      modifierValue: value,
    };
  }

  // 2) Weekend rules (a)
  if (isWeekend(d)) {
    const weekendRules = await RoomSpecialPrice.find({
      rooms: roomId,
      type: 'weekend',
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .lean();

    if (weekendRules.length > 0) {
      const rule = weekendRules[0];
      const value = rule.modifierValue ?? 0;
      const price = applyModifier(basePrice, rule.modifierType as 'percentage' | 'fixed', value);
      // Hiển thị đúng tên rule đặc biệt trong cột "Lý do"
      const label = (rule.name && String(rule.name).trim()) || 'Rule cuối tuần';
      return {
        price,
        label,
        basePrice,
        modifierType: rule.modifierType as 'percentage' | 'fixed',
        modifierValue: value,
      };
    }
  }

  // 3) Default
  return { price: basePrice, label: 'Giá gốc', basePrice };
}

/**
 * Compute room price breakdown for each night (checkIn to checkOut - 1 day each).
 * Returns array of { date, price, label } and total room price.
 */
export async function computeRoomPriceBreakdown(
  roomId: mongoose.Types.ObjectId,
  checkIn: Date,
  checkOut: Date,
  basePrice: number
): Promise<{ breakdown: IRoomPriceBreakdownItem[]; totalRoomPrice: number }> {
  const breakdown: IRoomPriceBreakdownItem[] = [];
  const start = toDateOnly(checkIn);
  const end = toDateOnly(checkOut);
  let totalRoomPrice = 0;

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    const result = await getEffectiveRoomPriceForDate(roomId, day, basePrice);
    breakdown.push({
      date: new Date(day),
      price: result.price,
      label: result.label,
      basePrice: result.basePrice,
      modifierType: result.modifierType,
      modifierValue: result.modifierValue,
    });
    totalRoomPrice += result.price;
  }

  return { breakdown, totalRoomPrice };
}

/**
 * Get preview of room price for a date range (for frontend display before booking).
 */
export async function getRoomPricePreview(
  roomId: mongoose.Types.ObjectId,
  checkIn: Date,
  checkOut: Date
): Promise<{ breakdown: IRoomPriceBreakdownItem[]; totalRoomPrice: number; basePrice: number } | null> {
  const room = await Room.findById(roomId).select('price').lean();
  if (!room) return null;
  const basePrice = room.price ?? 0;
  const { breakdown, totalRoomPrice } = await computeRoomPriceBreakdown(
    roomId,
    checkIn,
    checkOut,
    basePrice
  );
  return { breakdown, totalRoomPrice, basePrice };
}
