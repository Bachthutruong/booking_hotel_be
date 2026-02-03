"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPrice = exports.calculateNights = exports.createPaginationResponse = exports.getPagination = void 0;
const getPagination = (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPagination = getPagination;
const createPaginationResponse = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});
exports.createPaginationResponse = createPaginationResponse;
const calculateNights = (checkIn, checkOut) => {
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};
exports.calculateNights = calculateNights;
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};
exports.formatPrice = formatPrice;
//# sourceMappingURL=helpers.js.map