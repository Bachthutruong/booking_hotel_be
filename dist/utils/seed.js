"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
dotenv_1.default.config();
const seedData = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        // Clear existing data
        await models_1.User.deleteMany({});
        await models_1.Hotel.deleteMany({});
        await models_1.Room.deleteMany({});
        console.log('Cleared existing data');
        // Create admin user
        const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
        const admin = await models_1.User.create({
            email: 'admin@booking.com',
            password: adminPassword,
            fullName: 'Admin',
            phone: '0123456789',
            role: 'admin',
            isActive: true,
        });
        console.log('Created admin user:', admin.email);
        // Create test user
        const userPassword = await bcryptjs_1.default.hash('user123', 10);
        const user = await models_1.User.create({
            email: 'user@test.com',
            password: userPassword,
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            role: 'user',
            isActive: true,
        });
        console.log('Created test user:', user.email);
        // Create hotels
        const hotels = await models_1.Hotel.insertMany([
            {
                name: 'Vinpearl Resort & Spa Nha Trang',
                description: 'Vinpearl Resort & Spa Nha Trang là khu nghỉ dưỡng 5 sao sang trọng bậc nhất Việt Nam, tọa lạc trên đảo Hòn Tre xinh đẹp. Resort sở hữu bãi biển riêng tuyệt đẹp, nhiều tiện ích giải trí đẳng cấp và dịch vụ hoàn hảo.',
                address: 'Đảo Hòn Tre, Vĩnh Nguyên',
                city: 'Nha Trang',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
                    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
                ],
                amenities: ['Wifi miễn phí', 'Hồ bơi', 'Spa', 'Nhà hàng', 'Bar', 'Phòng gym', 'Bãi biển riêng', 'Dịch vụ đưa đón'],
                rating: 4.8,
                totalReviews: 1250,
                priceRange: { min: 2500000, max: 15000000 },
                policies: {
                    checkIn: '14:00',
                    checkOut: '12:00',
                    cancellation: 'Miễn phí hủy phòng trước 48 giờ',
                },
                isActive: true,
            },
            {
                name: 'InterContinental Danang Sun Peninsula',
                description: 'Nằm trên bán đảo Sơn Trà, InterContinental Danang Sun Peninsula Resort được thiết kế bởi kiến trúc sư nổi tiếng Bill Bensley, mang đến trải nghiệm nghỉ dưỡng độc đáo giữa thiên nhiên hoang sơ.',
                address: 'Bãi Bắc, Bán đảo Sơn Trà',
                city: 'Đà Nẵng',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
                    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
                    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
                ],
                amenities: ['Wifi miễn phí', 'Hồ bơi vô cực', 'Spa', 'Nhà hàng 5 sao', 'Bar', 'Phòng gym', 'Bãi biển riêng', 'Club trẻ em'],
                rating: 4.9,
                totalReviews: 890,
                priceRange: { min: 8000000, max: 50000000 },
                policies: {
                    checkIn: '15:00',
                    checkOut: '12:00',
                    cancellation: 'Miễn phí hủy phòng trước 72 giờ',
                },
                isActive: true,
            },
            {
                name: 'JW Marriott Phu Quoc Emerald Bay',
                description: 'JW Marriott Phu Quoc Emerald Bay Resort & Spa là kiệt tác kiến trúc của Bill Bensley, lấy cảm hứng từ trường đại học hư cấu, mang đến không gian nghỉ dưỡng độc đáo và đẳng cấp.',
                address: 'Bãi Khem, An Thới',
                city: 'Phú Quốc',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
                    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
                ],
                amenities: ['Wifi miễn phí', 'Hồ bơi', 'Spa', 'Nhiều nhà hàng', 'Bar', 'Phòng gym', 'Bãi biển riêng', 'Sân golf'],
                rating: 4.7,
                totalReviews: 678,
                priceRange: { min: 6000000, max: 35000000 },
                policies: {
                    checkIn: '15:00',
                    checkOut: '12:00',
                    cancellation: 'Miễn phí hủy phòng trước 48 giờ',
                },
                isActive: true,
            },
            {
                name: 'Sofitel Legend Metropole Hanoi',
                description: 'Khách sạn lịch sử và sang trọng bậc nhất Hà Nội, được xây dựng từ năm 1901. Sofitel Legend Metropole Hanoi là biểu tượng của sự thanh lịch và tinh tế Pháp giữa lòng thủ đô.',
                address: '15 Ngô Quyền, Hoàn Kiếm',
                city: 'Hà Nội',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
                    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
                    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
                ],
                amenities: ['Wifi miễn phí', 'Hồ bơi', 'Spa', 'Nhà hàng Pháp', 'Bar', 'Phòng gym', 'Dịch vụ quản gia'],
                rating: 4.9,
                totalReviews: 2100,
                priceRange: { min: 5000000, max: 25000000 },
                policies: {
                    checkIn: '14:00',
                    checkOut: '12:00',
                    cancellation: 'Miễn phí hủy phòng trước 24 giờ',
                },
                isActive: true,
            },
            {
                name: 'Park Hyatt Saigon',
                description: 'Park Hyatt Saigon là khách sạn 5 sao sang trọng tọa lạc ngay trung tâm Quận 1, đối diện Nhà hát Thành phố. Khách sạn mang phong cách kiến trúc Pháp cổ điển kết hợp nội thất hiện đại.',
                address: '2 Công Trường Lam Sơn, Quận 1',
                city: 'TP. Hồ Chí Minh',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
                    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
                ],
                amenities: ['Wifi miễn phí', 'Hồ bơi', 'Spa', 'Nhà hàng Ý', 'Bar', 'Phòng gym', 'Dịch vụ đưa đón'],
                rating: 4.8,
                totalReviews: 1560,
                priceRange: { min: 4500000, max: 20000000 },
                policies: {
                    checkIn: '15:00',
                    checkOut: '12:00',
                    cancellation: 'Miễn phí hủy phòng trước 24 giờ',
                },
                isActive: true,
            },
            {
                name: 'Mường Thanh Luxury Đà Lạt',
                description: 'Khách sạn 5 sao nằm ngay trung tâm thành phố Đà Lạt, gần hồ Xuân Hương. Mường Thanh Luxury Đà Lạt mang đến không gian nghỉ dưỡng ấm cúng giữa khí hậu se lạnh của cao nguyên.',
                address: '1 Phan Bội Châu',
                city: 'Đà Lạt',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800',
                    'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=800',
                    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
                ],
                amenities: ['Wifi miễn phí', 'Hồ bơi trong nhà', 'Spa', 'Nhà hàng', 'Bar', 'Phòng gym', 'Karaoke'],
                rating: 4.5,
                totalReviews: 890,
                priceRange: { min: 1500000, max: 8000000 },
                policies: {
                    checkIn: '14:00',
                    checkOut: '12:00',
                    cancellation: 'Miễn phí hủy phòng trước 24 giờ',
                },
                isActive: true,
            },
            {
                name: 'Amanoi Resort Ninh Thuận',
                description: 'Amanoi là khu nghỉ dưỡng siêu sang trọng nằm trong Vườn Quốc gia Núi Chúa, mang đến trải nghiệm yên bình và riêng tư tuyệt đối giữa thiên nhiên hoang sơ của vịnh Vĩnh Hy.',
                address: 'Vườn Quốc gia Núi Chúa, Vĩnh Hy',
                city: 'Ninh Thuận',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
                    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
                ],
                amenities: ['Wifi miễn phí', 'Hồ bơi riêng', 'Spa', 'Nhà hàng', 'Yoga', 'Lặn biển', 'Bãi biển riêng'],
                rating: 5.0,
                totalReviews: 234,
                priceRange: { min: 20000000, max: 100000000 },
                policies: {
                    checkIn: '15:00',
                    checkOut: '12:00',
                    cancellation: 'Không hoàn tiền',
                },
                isActive: true,
            },
            {
                name: 'Fusion Maia Resort Đà Nẵng',
                description: 'Fusion Maia là khu nghỉ dưỡng boutique độc đáo với concept "all-spa inclusive" - tất cả dịch vụ spa đều được bao gồm trong giá phòng, mang đến trải nghiệm thư giãn tuyệt đối.',
                address: 'Võ Nguyên Giáp, Ngũ Hành Sơn',
                city: 'Đà Nẵng',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800',
                    'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=800',
                    'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800',
                ],
                amenities: ['Wifi miễn phí', 'Hồ bơi riêng', 'Spa không giới hạn', 'Nhà hàng', 'Bar', 'Yoga', 'Bãi biển'],
                rating: 4.7,
                totalReviews: 567,
                priceRange: { min: 5500000, max: 18000000 },
                policies: {
                    checkIn: '14:00',
                    checkOut: '12:00',
                    cancellation: 'Miễn phí hủy phòng trước 48 giờ',
                },
                isActive: true,
            },
        ]);
        console.log(`Created ${hotels.length} hotels`);
        // Create rooms for each hotel
        const roomTypes = [
            {
                name: 'Phòng Superior',
                type: 'standard',
                description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho chuyến công tác hoặc du lịch ngắn ngày.',
                priceMultiplier: 1,
                capacity: { adults: 2, children: 1 },
                size: 28,
                bedType: '1 giường đôi lớn',
                amenities: ['Wifi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Két an toàn'],
            },
            {
                name: 'Phòng Deluxe',
                type: 'deluxe',
                description: 'Phòng cao cấp với không gian rộng rãi và view đẹp, trang bị tiện nghi hiện đại.',
                priceMultiplier: 1.5,
                capacity: { adults: 2, children: 2 },
                size: 35,
                bedType: '1 giường King size',
                amenities: ['Wifi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Két an toàn', 'Bồn tắm', 'View đẹp'],
            },
            {
                name: 'Suite Hướng Biển',
                type: 'suite',
                description: 'Suite sang trọng với phòng khách riêng biệt và ban công hướng biển tuyệt đẹp.',
                priceMultiplier: 2.5,
                capacity: { adults: 3, children: 2 },
                size: 55,
                bedType: '1 giường King size + Sofa bed',
                amenities: ['Wifi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Két an toàn', 'Bồn tắm', 'Phòng khách', 'Ban công', 'Butler service'],
            },
            {
                name: 'Villa Hồ Bơi Riêng',
                type: 'villa',
                description: 'Villa riêng biệt với hồ bơi riêng, sân vườn và không gian sống hoàn toàn riêng tư.',
                priceMultiplier: 4,
                capacity: { adults: 4, children: 2 },
                size: 120,
                bedType: '2 giường King size',
                amenities: ['Wifi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Két an toàn', 'Bồn tắm', 'Hồ bơi riêng', 'Sân vườn', 'Butler service', 'Bếp nhỏ'],
            },
        ];
        const rooms = [];
        for (const hotel of hotels) {
            for (const roomType of roomTypes) {
                const basePrice = hotel.priceRange.min;
                rooms.push({
                    hotel: hotel._id,
                    name: roomType.name,
                    type: roomType.type,
                    description: roomType.description,
                    price: Math.round(basePrice * roomType.priceMultiplier),
                    capacity: roomType.capacity,
                    size: roomType.size,
                    bedType: roomType.bedType,
                    images: hotel.images.slice(0, 2),
                    amenities: roomType.amenities,
                    quantity: Math.floor(Math.random() * 5) + 3,
                    isActive: true,
                });
            }
        }
        await models_1.Room.insertMany(rooms);
        console.log(`Created ${rooms.length} rooms`);
        console.log('\n=== Seed completed successfully ===');
        console.log('\nTest accounts:');
        console.log('Admin: admin@booking.com / admin123');
        console.log('User: user@test.com / user123');
        process.exit(0);
    }
    catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};
seedData();
//# sourceMappingURL=seed.js.map