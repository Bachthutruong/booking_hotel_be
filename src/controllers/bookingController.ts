import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Booking, Room, Service, User, WalletTransaction, Notification, SystemConfig } from '../models';
import { AuthRequest, IBookingService } from '../types';
import { getPagination, createPaginationResponse, calculateNights } from '../utils/helpers';
import { generateToken } from '../utils/jwt';

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
export const getBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, paymentStatus, startDate, endDate, search, checkInStart, checkInEnd, hotelId, roomId } = req.query;

    const query: any = {};

    // If not admin, only show user's own bookings
    if (req.user?.role !== 'admin') {
      query.user = req.user?._id;
    }

    if (hotelId) {
      query.hotel = hotelId;
    }

    if (roomId) {
      query.room = roomId;
    }

    if (status) {
      const statusList = (status as string).split(',').map((s) => s.trim()).filter(Boolean);
      query.status = statusList.length > 1 ? { $in: statusList } : statusList[0];
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by creation date
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // Filter by check-in date
    if (checkInStart || checkInEnd) {
      query.checkIn = {};
      if (checkInStart) query.checkIn.$gte = new Date(checkInStart as string);
      if (checkInEnd) query.checkIn.$lte = new Date(checkInEnd as string);
    }

    // Search text (name, phone, email, invoice)
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { 'contactInfo.fullName': searchRegex },
        { 'contactInfo.phone': searchRegex },
        { 'contactInfo.email': searchRegex },
        { invoiceNumber: searchRegex },
        // Also allow searching by Booking ID (since it's an ObjectId, exact match or string check usually needed, but regex works on stringified ObjectId in aggregation, but here it's simple find)
        // For simplicity in find(), we usually skip ObjectId regex unless we use aggregation. 
        // We can check if search string is a valid ObjectId
        ...(mongoose.Types.ObjectId.isValid(search as string) ? [{ _id: search }] : [])
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'fullName email phone')
        .populate('hotel', 'name city images')
        .populate('room', 'name type price images')
        .populate('services.service', 'name price')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: createPaginationResponse(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate('hotel', 'name address city images policies')
      .populate('room', 'name type price images amenities')
      .populate('services.service', 'name price description icon requiresConfirmation')
      .lean();

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt phòng',
      });
      return;
    }

    // Check if user owns this booking or is admin
    if (
      req.user?.role !== 'admin' &&
      booking.user._id.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đặt phòng này',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create booking (User hoặc Guest - không bắt buộc đăng nhập)
// @route   POST /api/bookings
// @access  Public (optionalAuth: nếu đã đăng nhập thì dùng user, nếu guest thì tìm/tạo tài khoản theo email+phone)
export const createBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      hotelId,
      roomId,
      checkIn,
      checkOut,
      guests,
      contactInfo: bodyContactInfo,
      specialRequests,
      services: requestedServices, // Array of { serviceId, quantity }
    } = req.body;

    // Xác định user và contactInfo
    let userId: mongoose.Types.ObjectId;
    let contactInfo = bodyContactInfo;
    let createdNewUser: InstanceType<typeof User> | null = null;

    if (req.user) {
      userId = req.user._id;
      contactInfo = contactInfo || {
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
      };
    } else {
      // Guest: bắt buộc fullName, email, phone
      if (!bodyContactInfo?.fullName || !bodyContactInfo?.email || !bodyContactInfo?.phone) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ Họ tên, Email và Số điện thoại',
        });
        return;
      }
      const normalizedEmail = String(bodyContactInfo.email).trim().toLowerCase();
      const normalizedPhone = String(bodyContactInfo.phone).trim();
      contactInfo = {
        fullName: String(bodyContactInfo.fullName).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
      };

      let user = await User.findOne({ email: normalizedEmail, phone: normalizedPhone });
      if (!user) {
        user = await User.create({
          email: normalizedEmail,
          fullName: contactInfo.fullName,
          phone: normalizedPhone,
          isEmailVerified: true,
          isActive: true,
          role: 'user',
        });
        createdNewUser = user;
      }
      userId = user._id;
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      res.status(400).json({
        success: false,
        message: 'Ngày check-out phải sau ngày check-in',
      });
      return;
    }

    if (checkInDate < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Ngày check-in không thể trong quá khứ',
      });
      return;
    }

    // Get room and check availability
    const room = await Room.findById(roomId);

    if (!room || !room.isActive) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng',
      });
      return;
    }

    // Validate guest count against room capacity
    const requestedAdults = guests?.adults || 1;
    const requestedChildren = guests?.children || 0;

    if (requestedAdults > room.capacity.adults) {
      res.status(400).json({
        success: false,
        message: `Phòng này chỉ cho phép tối đa ${room.capacity.adults} người lớn`,
      });
      return;
    }

    if (requestedChildren > room.capacity.children) {
      res.status(400).json({
        success: false,
        message: `Phòng này chỉ cho phép tối đa ${room.capacity.children} trẻ em`,
      });
      return;
    }

    // Check room availability
    const bookedRooms = await Booking.countDocuments({
      room: roomId,
      status: { $in: ['pending', 'confirmed', 'pending_deposit', 'awaiting_approval'] },
      $or: [
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gt: checkInDate },
        },
      ],
    });

    if (bookedRooms >= room.quantity) {
      res.status(400).json({
        success: false,
        message: 'Phòng đã hết trong khoảng thời gian này',
      });
      return;
    }

    // Calculate total price
    const nights = calculateNights(checkInDate, checkOutDate);
    let totalPrice = room.price * nights;
    const bookingServices: IBookingService[] = [];

    // Process services if any
    if (requestedServices && Array.isArray(requestedServices)) {
      for (const item of requestedServices) {
        const service = await Service.findById(item.serviceId);
        if (service && service.isActive) {
           const quantity = item.quantity || 1;
           const price = service.price; // Use current price
           totalPrice += price * quantity;
           bookingServices.push({
             service: service._id,
             quantity,
             price,
             addedAt: new Date(),
           });
        }
      }
    }

    // Calculate room price and service price separately
    const roomPrice = room.price * nights;
    const servicePrice = bookingServices.reduce((sum, s) => sum + s.price * s.quantity, 0);

    // Create booking
    const booking = await Booking.create({
      user: userId,
      hotel: hotelId,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      roomPrice,
      servicePrice,
      totalPrice,
      estimatedPrice: totalPrice,
      services: bookingServices,
      contactInfo,
      specialRequests,
      status: 'pending_deposit', // Start as pending deposit
      paymentStatus: 'pending',
      paymentMethod: 'bank_transfer',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price');

    // Thông báo cho admin khi đặt phòng có kèm dịch vụ
    if (bookingServices.length > 0) {
      const hotel = await mongoose.model('Hotel').findById(hotelId).select('name').lean();
      await Notification.create({
        type: 'booking_created_with_services',
        title: 'Đặt phòng mới có dịch vụ',
        message: `Khách đặt phòng tại ${(hotel as any)?.name || 'Khách sạn'} đã thêm ${bookingServices.length} dịch vụ. Mã đặt phòng: ${booking._id}`,
        recipientRole: 'admin',
        referenceType: 'Booking',
        referenceId: booking._id,
      });
    }

    const response: any = {
      success: true,
      data: populatedBooking,
    };
    // Guest vừa được tạo tài khoản: trả token + user để frontend tự động đăng nhập
    if (createdNewUser) {
      response.token = generateToken(createdNewUser._id.toString());
      response.user = {
        _id: createdNewUser._id,
        email: createdNewUser.email,
        fullName: createdNewUser.fullName,
        phone: createdNewUser.phone,
        avatar: createdNewUser.avatar,
        role: createdNewUser.role,
      };
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Create booking (Admin)
// @route   POST /api/bookings/admin
// @access  Private/Admin
// Body: userId (optional) hoặc contactInfo (fullName, email, phone). Nếu không có userId thì tìm/tạo user theo email+phone.
export const createBookingAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      userId: bodyUserId,
      hotelId,
      roomId,
      checkIn,
      checkOut,
      guests,
      contactInfo: bodyContactInfo,
      specialRequests,
      services: requestedServices,
      status, // Admin can set initial status
      paymentStatus
    } = req.body;

    let userId: mongoose.Types.ObjectId;
    let contactInfo: { fullName: string; email: string; phone: string };

    if (bodyUserId) {
      // Chọn từ danh sách khách hàng có sẵn
      const user = await User.findById(bodyUserId);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
        return;
      }
      userId = user._id as mongoose.Types.ObjectId;
      contactInfo = bodyContactInfo && (bodyContactInfo.fullName || bodyContactInfo.email || bodyContactInfo.phone)
        ? {
          fullName: String(bodyContactInfo.fullName || user.fullName).trim(),
          email: String(bodyContactInfo.email || user.email || '').trim().toLowerCase(),
          phone: String(bodyContactInfo.phone || user.phone || '').trim(),
        }
        : { fullName: user.fullName, email: user.email || '', phone: user.phone || '' };
    } else {
      // Nhập thông tin khách mới: tìm hoặc tạo user theo email + phone
      if (!bodyContactInfo?.fullName || !bodyContactInfo?.email || !bodyContactInfo?.phone) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ Họ tên, Email và Số điện thoại cho khách hàng',
        });
        return;
      }
      const normalizedEmail = String(bodyContactInfo.email).trim().toLowerCase();
      const normalizedPhone = String(bodyContactInfo.phone).trim();
      contactInfo = {
        fullName: String(bodyContactInfo.fullName).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
      };

      let user = await User.findOne({ email: normalizedEmail, phone: normalizedPhone });
      if (!user) {
        user = await User.create({
          email: normalizedEmail,
          fullName: contactInfo.fullName,
          phone: normalizedPhone,
          isEmailVerified: true,
          isActive: true,
          role: 'user',
        });
      } else {
        // Cập nhật fullName nếu khác
        if (user.fullName !== contactInfo.fullName) {
          user.fullName = contactInfo.fullName;
          await user.save();
        }
      }
      userId = user._id as mongoose.Types.ObjectId;
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      res.status(400).json({
        success: false,
        message: 'Ngày check-out phải sau ngày check-in',
      });
      return;
    }

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    // Calculate total price breakdown
    const nights = calculateNights(checkInDate, checkOutDate);
    const roomPrice = room.price * nights;
    let servicePrice = 0;
    const bookingServices: IBookingService[] = [];

    // Process services
    if (requestedServices && Array.isArray(requestedServices)) {
      for (const item of requestedServices) {
        const service = await Service.findById(item.serviceId);
        if (service) {
           const quantity = item.quantity || 1;
           const price = service.price;
           servicePrice += price * quantity;
           bookingServices.push({
             service: service._id,
             quantity,
             price,
             addedAt: new Date(),
           });
        }
      }
    }

    const totalPrice = roomPrice + servicePrice;

    // Create booking
    const booking = await Booking.create({
      user: userId,
      hotel: hotelId,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      roomPrice,
      servicePrice,
      totalPrice,
      estimatedPrice: totalPrice,
      services: bookingServices,
      contactInfo,
      specialRequests,
      status: status || 'confirmed',
      paymentStatus: paymentStatus || 'pending',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price');

    // Thông báo khi admin đặt phòng có kèm dịch vụ
    if (bookingServices.length > 0) {
      const hotel = await mongoose.model('Hotel').findById(hotelId).select('name').lean();
      await Notification.create({
        type: 'booking_created_with_services',
        title: 'Đặt phòng (admin) có dịch vụ',
        message: `Đặt phòng tại ${(hotel as any)?.name || 'Khách sạn'} (do admin tạo) đã thêm ${bookingServices.length} dịch vụ. Mã đặt phòng: ${booking._id}`,
        recipientRole: 'admin',
        referenceType: 'Booking',
        referenceId: booking._id,
      });
    }

    res.status(201).json({
      success: true,
      data: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload payment proof (URL from client)
// @route   PUT /api/bookings/:id/proof
// @access  Private
export const uploadPaymentProof = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { proofImage } = req.body; // URL from cloud storage
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    booking.proofImage = proofImage;
    booking.status = 'awaiting_approval';
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Payment proof uploaded, awaiting admin approval'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload payment proof (file) — không cần đăng nhập, dùng cho khách có link thanh toán
// @route   POST /api/bookings/:id/upload-proof
// @access  Public (chỉ cho đơn đang chờ cọc)
export const uploadProofFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.status !== 'pending_deposit') {
      res.status(400).json({
        success: false,
        message: 'Chỉ được tải minh chứng khi đơn đang chờ thanh toán cọc.',
      });
      return;
    }

    const file = (req as any).file;
    if (!file || !file.path) {
      res.status(400).json({ success: false, message: 'Chưa chọn ảnh hoặc upload thất bại.' });
      return;
    }

    booking.proofImage = file.path;
    booking.status = 'awaiting_approval';
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Đã gửi minh chứng thanh toán, đang chờ xác nhận.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trừ tiền cọc từ ví (user đủ tiền cọc thì xác nhận trừ thẳng, không cần chuyển khoản)
// @route   POST /api/bookings/:id/pay-deposit-wallet
// @access  Private
export const payDepositFromWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng' });
      return;
    }
    if (booking.user.toString() !== req.user?._id.toString()) {
      await session.abortTransaction();
      res.status(403).json({ success: false, message: 'Không có quyền' });
      return;
    }
    if (booking.status !== 'pending_deposit') {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Đơn không ở trạng thái chờ cọc' });
      return;
    }

    const depositConfig = await SystemConfig.findOne({ key: 'deposit_config' }).session(session);
    let depositAmount = booking.totalPrice;
    if (depositConfig?.value) {
      const cfg = depositConfig.value as { type?: string; value?: number };
      if (cfg.type === 'percentage' && typeof cfg.value === 'number') {
        depositAmount = Math.round((booking.totalPrice * cfg.value) / 100);
      } else if (cfg.type === 'fixed' && typeof cfg.value === 'number') {
        depositAmount = Math.min(cfg.value, booking.totalPrice);
      }
    }

    const user = await User.findById(booking.user).session(session);
    if (!user) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      return;
    }
    if (user.walletBalance < depositAmount) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: `Số dư ví không đủ. Cần ${depositAmount.toLocaleString('vi-VN')} VND, hiện có ${user.walletBalance.toLocaleString('vi-VN')} VND`
      });
      return;
    }

    const balanceBefore = user.walletBalance;
    user.walletBalance -= depositAmount;
    await user.save({ session });

    booking.paidFromWallet = depositAmount;
    booking.paymentMethod = 'wallet';
    booking.status = 'awaiting_approval';
    await booking.save({ session });

    await WalletTransaction.create([{
      user: user._id,
      type: 'payment',
      amount: depositAmount,
      balanceBefore,
      balanceAfter: user.walletBalance,
      bonusBalanceBefore: user.bonusBalance,
      bonusBalanceAfter: user.bonusBalance,
      description: `Đặt cọc đặt phòng - ${booking._id}`,
      reference: booking._id,
      referenceModel: 'Booking',
      status: 'completed',
    }], { session });

    await session.commitTransaction();

    const populated = await Booking.findById(booking._id)
      .populate('user', 'fullName email phone')
      .populate('hotel', 'name address city images')
      .populate('room', 'name type price images')
      .populate('services.service', 'name price');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Đã trừ tiền cọc từ ví. Đơn đang chờ xác nhận.',
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Approve/Reject booking (Admin)
// @route   PUT /api/bookings/:id/approve
// @access  Private/Admin
export const approveBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (action === 'approve') {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
    } else if (action === 'reject') {
      booking.status = 'pending_deposit'; // Ask user to try again
      // Optional: Add rejection reason
    } else {
        res.status(400).json({ success: false, message: 'Invalid action' });
        return;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt phòng',
      });
      return;
    }

    // Check if user owns this booking or is admin
    if (
      req.user?.role !== 'admin' &&
      booking.user.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đặt phòng này',
      });
      return;
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Đặt phòng đã được hủy trước đó',
      });
      return;
    }

    if (booking.status === 'completed') {
      res.status(400).json({
        success: false,
        message: 'Không thể hủy đặt phòng đã hoàn thành',
      });
      return;
    }

    booking.status = 'cancelled';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Đã hủy đặt phòng thành công',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (General)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
export const updateBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, paymentStatus } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'fullName email phone')
      .populate('hotel', 'name city')
      .populate('room', 'name type price');

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt phòng',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in booking
// @route   PUT /api/bookings/:id/checkin
// @access  Private/Admin
export const checkInBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.status !== 'confirmed') {
      res.status(400).json({ success: false, message: 'Booking must be confirmed before check-in' });
      return;
    }

    booking.actualCheckIn = new Date();
    booking.status = 'confirmed'; // Keep confirmed, actualCheckIn marks they checked in
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'fullName email phone walletBalance bonusBalance')
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price');

    res.status(200).json({
      success: true,
      data: populatedBooking,
      message: 'Check-in successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add service to booking (via QR scan)
// @route   POST /api/bookings/:id/services
// @access  Private
export const addServiceToBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { serviceId, quantity = 1 } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Only allow adding services to active bookings (checked in)
    if (booking.status !== 'confirmed' || !booking.actualCheckIn) {
      res.status(400).json({ success: false, message: 'Can only add services to checked-in bookings' });
      return;
    }

    // Check if booking belongs to user or admin is making request
    if (req.user?.role !== 'admin' && booking.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    // Check if service already exists in booking
    const existingServiceIndex = booking.services.findIndex(
      s => s.service.toString() === serviceId
    );

    if (existingServiceIndex > -1) {
      booking.services[existingServiceIndex].quantity += quantity;
    } else {
      booking.services.push({
        service: service._id,
        quantity,
        price: service.price,
        addedAt: new Date(),
      });
    }

    // Recalculate prices
    booking.servicePrice = booking.services.reduce((sum, s) => sum + s.price * s.quantity, 0);
    booking.estimatedPrice = booking.roomPrice + booking.servicePrice;

    await booking.save();

    // Thông báo cho admin: khách đã thêm dịch vụ vào đặt phòng
    const hotel = await mongoose.model('Hotel').findById(booking.hotel).select('name').lean();
    const room = await mongoose.model('Room').findById(booking.room).select('name').lean();
    await Notification.create({
      type: 'booking_service_added',
      title: 'Khách thêm dịch vụ vào đặt phòng',
      message: `Đặt phòng ${(room as any)?.name || ''} tại ${(hotel as any)?.name || 'Khách sạn'} vừa thêm dịch vụ: ${service.name} x${quantity}.`,
      recipientRole: 'admin',
      referenceType: 'Booking',
      referenceId: booking._id,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'fullName email phone')
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price icon requiresConfirmation');

    res.status(200).json({
      success: true,
      data: populatedBooking,
      message: 'Service added successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark service as delivered (admin - cho dịch vụ cần xác nhận)
// @route   PATCH /api/bookings/:id/services/deliver
// @access  Private/Admin
export const markServiceDelivered = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { serviceIndex } = req.body as { serviceIndex: number };

    if (typeof serviceIndex !== 'number' || serviceIndex < 0) {
      res.status(400).json({ success: false, message: 'serviceIndex phải là số >= 0' });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng' });
      return;
    }

    if (serviceIndex >= booking.services.length) {
      res.status(400).json({ success: false, message: 'Chỉ số dịch vụ không hợp lệ' });
      return;
    }

    booking.services[serviceIndex].deliveredAt = new Date();
    booking.markModified('services');
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('user', 'fullName email phone')
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price icon requiresConfirmation');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Đã xác nhận bàn giao dịch vụ',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all services as delivered (admin)
// @route   PATCH /api/bookings/:id/services/deliver-all
// @access  Private/Admin
export const markAllServicesDelivered = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng' });
      return;
    }

    let count = 0;
    for (let i = 0; i < booking.services.length; i++) {
      if (!booking.services[i].deliveredAt) {
        booking.services[i].deliveredAt = new Date();
        count++;
      }
    }
    if (count > 0) {
      booking.markModified('services');
      await booking.save();
    }

    const populated = await Booking.findById(booking._id)
      .populate('user', 'fullName email phone')
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price icon requiresConfirmation');

    res.status(200).json({
      success: true,
      data: populated,
      message: count > 0 ? `Đã xác nhận bàn giao ${count} dịch vụ` : 'Tất cả dịch vụ đã được bàn giao',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get estimated bill for booking
// @route   GET /api/bookings/:id/bill
// @access  Private
export const getBookingBill = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'fullName email phone walletBalance bonusBalance')
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price icon');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Check authorization
    if (req.user?.role !== 'admin' && booking.user._id.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const user = await User.findById(booking.user._id);
    const nights = calculateNights(new Date(booking.checkIn), new Date(booking.checkOut));
    const paidFromWallet = Number(booking.paidFromWallet) || 0;
    const paidFromBonus = Number(booking.paidFromBonus) || 0;
    const totalPaid = paidFromWallet + paidFromBonus;
    const estimatedTotal = booking.estimatedPrice ?? booking.totalPrice ?? 0;
    const amountDue = Math.max(0, estimatedTotal - totalPaid);

    res.status(200).json({
      success: true,
      data: {
        booking,
        summary: {
          roomPrice: booking.roomPrice,
          servicePrice: booking.servicePrice,
          estimatedTotal,
          nights,
          userWalletBalance: user?.walletBalance || 0,
          userBonusBalance: user?.bonusBalance || 0,
          paidFromWallet,
          paidFromBonus,
          totalPaid,
          amountDue,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Checkout booking with payment
// @route   POST /api/bookings/:id/checkout
// @access  Private/Admin
export const checkoutBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentOption, checkoutNote } = req.body; // 'use_bonus' | 'use_main_only'
    const booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.status === 'completed') {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Booking already completed' });
      return;
    }

    if (booking.status !== 'confirmed') {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Booking must be confirmed' });
      return;
    }

    const user = await User.findById(booking.user).session(session);
    if (!user) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const finalPrice = booking.estimatedPrice ?? booking.totalPrice ?? 0;
    const alreadyPaidFromWallet = Number(booking.paidFromWallet) || 0;
    const alreadyPaidFromBonus = Number(booking.paidFromBonus) || 0;
    const totalAlreadyPaid = alreadyPaidFromWallet + alreadyPaidFromBonus;
    let amountDue = Math.max(0, finalPrice - totalAlreadyPaid);

    let paidFromWallet = 0;
    let paidFromBonus = 0;
    let remainingToPay = amountDue;

    if (paymentOption === 'use_bonus') {
      // First use bonus balance, then main wallet
      if (user.bonusBalance >= remainingToPay) {
        paidFromBonus = remainingToPay;
        remainingToPay = 0;
      } else {
        paidFromBonus = user.bonusBalance;
        remainingToPay -= paidFromBonus;

        if (user.walletBalance >= remainingToPay) {
          paidFromWallet = remainingToPay;
          remainingToPay = 0;
        } else {
          paidFromWallet = user.walletBalance;
          remainingToPay -= paidFromWallet;
        }
      }
    } else {
      // use_main_only - Only use main wallet balance
      if (user.walletBalance >= remainingToPay) {
        paidFromWallet = remainingToPay;
        remainingToPay = 0;
      } else {
        paidFromWallet = user.walletBalance;
        remainingToPay -= paidFromWallet;
      }
    }

    const balanceBefore = user.walletBalance;
    const bonusBalanceBefore = user.bonusBalance;

    user.walletBalance -= paidFromWallet;
    user.bonusBalance -= paidFromBonus;
    await user.save({ session });

    const invoiceNumber = `INV-${Date.now()}-${booking._id.toString().slice(-6).toUpperCase()}`;

    booking.actualCheckOut = new Date();
    booking.finalPrice = finalPrice;
    booking.paidFromWallet = alreadyPaidFromWallet + paidFromWallet;
    booking.paidFromBonus = alreadyPaidFromBonus + paidFromBonus;
    booking.paymentOption = paymentOption;
    booking.status = 'completed';
    booking.paymentStatus = remainingToPay === 0 ? 'paid' : 'pending';
    booking.invoiceNumber = invoiceNumber;
    booking.checkoutNote = checkoutNote;
    await booking.save({ session });

    // Create wallet transaction if paid from wallet
    if (paidFromWallet > 0 || paidFromBonus > 0) {
      await WalletTransaction.create([{
        user: user._id,
        type: 'payment',
        amount: paidFromWallet + paidFromBonus,
        balanceBefore,
        balanceAfter: user.walletBalance,
        bonusBalanceBefore,
        bonusBalanceAfter: user.bonusBalance,
        description: `Thanh toán phòng - ${invoiceNumber}`,
        reference: booking._id,
        referenceModel: 'Booking',
        status: 'completed',
      }], { session });
    }

    await session.commitTransaction();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'fullName email phone walletBalance bonusBalance')
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price icon');

    res.status(200).json({
      success: true,
      data: {
        booking: populatedBooking,
        payment: {
          totalAmount: finalPrice,
          paidFromWallet,
          paidFromBonus,
          remainingToPay,
          invoiceNumber,
        },
      },
      message: remainingToPay === 0 ? 'Checkout successful' : `Checkout completed. Remaining to pay: ${remainingToPay.toLocaleString()} VND`,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Pay booking with wallet
// @route   POST /api/bookings/:id/pay-wallet
// @access  Private
export const payWithWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentOption } = req.body; // 'use_bonus' | 'use_main_only'
    const booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.user.toString() !== req.user?._id.toString()) {
      await session.abortTransaction();
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (booking.paymentStatus === 'paid') {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Booking already paid' });
      return;
    }

    const user = await User.findById(booking.user).session(session);
    if (!user) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const amountToPay = booking.totalPrice;
    let paidFromWallet = 0;
    let paidFromBonus = 0;
    let remainingToPay = amountToPay;

    if (paymentOption === 'use_bonus') {
      if (user.bonusBalance >= remainingToPay) {
        paidFromBonus = remainingToPay;
        remainingToPay = 0;
      } else {
        paidFromBonus = user.bonusBalance;
        remainingToPay -= paidFromBonus;

        if (user.walletBalance >= remainingToPay) {
          paidFromWallet = remainingToPay;
          remainingToPay = 0;
        } else {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            message: `Insufficient balance. Need ${amountToPay.toLocaleString()} VND, have ${(user.walletBalance + user.bonusBalance).toLocaleString()} VND`
          });
          return;
        }
      }
    } else {
      if (user.walletBalance >= remainingToPay) {
        paidFromWallet = remainingToPay;
        remainingToPay = 0;
      } else {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Need ${amountToPay.toLocaleString()} VND, have ${user.walletBalance.toLocaleString()} VND`
        });
        return;
      }
    }

    const balanceBefore = user.walletBalance;
    const bonusBalanceBefore = user.bonusBalance;

    user.walletBalance -= paidFromWallet;
    user.bonusBalance -= paidFromBonus;
    await user.save({ session });

    booking.paymentMethod = 'wallet';
    booking.paymentOption = paymentOption;
    booking.paidFromWallet = paidFromWallet;
    booking.paidFromBonus = paidFromBonus;
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    await booking.save({ session });

    await WalletTransaction.create([{
      user: user._id,
      type: 'payment',
      amount: paidFromWallet + paidFromBonus,
      balanceBefore,
      balanceAfter: user.walletBalance,
      bonusBalanceBefore,
      bonusBalanceAfter: user.bonusBalance,
      description: `Thanh toán đặt phòng - ${booking._id}`,
      reference: booking._id,
      referenceModel: 'Booking',
      status: 'completed',
    }], { session });

    await session.commitTransaction();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'fullName email phone walletBalance bonusBalance')
      .populate('hotel', 'name address city')
      .populate('room', 'name type price')
      .populate('services.service', 'name price');

    res.status(200).json({
      success: true,
      data: {
        booking: populatedBooking,
        payment: {
          totalAmount: amountToPay,
          paidFromWallet,
          paidFromBonus,
        },
      },
      message: 'Payment successful',
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get invoice data for printing
// @route   GET /api/bookings/:id/invoice
// @access  Private
export const getInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate('hotel', 'name address city phone')
      .populate('room', 'name type price')
      .populate('services.service', 'name price');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Check authorization
    if (req.user?.role !== 'admin' && booking.user._id.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const nights = calculateNights(new Date(booking.checkIn), new Date(booking.checkOut));

    const invoice = {
      invoiceNumber: booking.invoiceNumber || `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
      createdAt: booking.updatedAt || booking.createdAt,
      hotel: booking.hotel,
      guest: {
        name: booking.contactInfo.fullName,
        email: booking.contactInfo.email,
        phone: booking.contactInfo.phone,
      },
      room: booking.room,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      actualCheckIn: booking.actualCheckIn,
      actualCheckOut: booking.actualCheckOut,
      nights,
      items: [
        {
          description: `${(booking.room as any).name} x ${nights} đêm`,
          quantity: nights,
          unitPrice: (booking.room as any).price,
          total: booking.roomPrice,
        },
        ...booking.services.map(s => ({
          description: (s.service as any).name,
          quantity: s.quantity,
          unitPrice: s.price,
          total: s.price * s.quantity,
        })),
      ],
      subtotal: booking.estimatedPrice || booking.totalPrice,
      paidFromWallet: booking.paidFromWallet || 0,
      paidFromBonus: booking.paidFromBonus || 0,
      totalPaid: (booking.paidFromWallet || 0) + (booking.paidFromBonus || 0),
      finalAmount: booking.finalPrice || booking.totalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
    };

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};