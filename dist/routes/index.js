"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const hotelRoutes_1 = __importDefault(require("./hotelRoutes"));
const roomRoutes_1 = __importDefault(require("./roomRoutes"));
const bookingRoutes_1 = __importDefault(require("./bookingRoutes"));
const reviewRoutes_1 = __importDefault(require("./reviewRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const serviceRoutes_1 = __importDefault(require("./serviceRoutes"));
const systemConfigRoutes_1 = __importDefault(require("./systemConfigRoutes"));
const uploadRoutes_1 = __importDefault(require("./uploadRoutes"));
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.use('/users', userRoutes_1.default);
router.use('/hotels', hotelRoutes_1.default);
router.use('/rooms', roomRoutes_1.default);
router.use('/bookings', bookingRoutes_1.default);
router.use('/reviews', reviewRoutes_1.default);
router.use('/dashboard', dashboardRoutes_1.default);
router.use('/services', serviceRoutes_1.default);
router.use('/config', systemConfigRoutes_1.default);
router.use('/upload', uploadRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map