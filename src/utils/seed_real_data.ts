import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Hotel, Room, RoomCategory, Review, Booking, User } from '../models';

dotenv.config();

// Kết nối database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || '');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Dữ liệu mẫu
const categoriesData = [
  {
    name: 'Standard Room',
    description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho khách du lịch ngắn ngày.',
    icon: '🛏️',
    order: 1,
    isActive: true,
  },
  {
    name: 'Deluxe Room',
    description: 'Phòng cao cấp với diện tích rộng hơn, view đẹp và nội thất sang trọng.',
    icon: '✨',
    order: 2,
    isActive: true,
  },
  {
    name: 'Executive Suite',
    description: 'Căn hộ cao cấp với phòng khách riêng biệt, bồn tắm nằm và dịch vụ phòng 24/7.',
    icon: '💎',
    order: 3,
    isActive: true,
  },
  {
    name: 'Presidential Suite',
    description: 'Hạng phòng sang trọng nhất, dành cho nguyên thủ và giới thượng lưu với an ninh tuyệt đối.',
    icon: '👑',
    order: 4,
    isActive: true,
  },
];

const hotelsData = [
  {
    name: 'Sheraton Hanoi Hotel',
    description: 'Tọa lạc bên cạnh Hồ Tây yên bình, Sheraton Hanoi Hotel mang đến sự kết hợp hài hòa giữa văn hóa Hà Nội và kiến trúc Pháp cổ điển. Khách sạn có 299 phòng nghỉ rộng rãi, tất cả đều có tầm nhìn hướng hồ tuyệt đẹp.',
    address: 'K5 Nghi Tàm, 11 Xuân Diệu, Tây Hồ',
    city: 'Hà Nội',
    country: 'Việt Nam',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Hồ bơi ngoài trời', 'Spa & Massage', 'Phòng Gym', 'Nhà hàng 5 sao', 'Bar', 'Phòng họp', 'Xe đưa đón sân bay'],
    rating: 5,
    totalReviews: 120,
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Hủy phòng miễn phí trước 24h',
    },
    basePrice: 2500000, 
  },
  {
    name: 'Hanoi Daewoo Hotel',
    description: 'Là một biểu tượng của sự sang trọng tại Hà Nội từ năm 1996, Daewoo Hotel nổi tiếng với kiến trúc tráng lệ, bể bơi vô cực lớn nhất thành phố và khuôn viên vườn xanh mát.',
    address: '360 Kim Mã, Ba Đình',
    city: 'Hà Nội',
    country: 'Việt Nam',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-6e5a513e610a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Bể bơi vô cực', 'Sân vườn', 'Casino', 'Phòng Gym', 'Khu vui chơi trẻ em', 'Nhà hàng Nhật Bản'],
    rating: 4.8,
    totalReviews: 85,
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Hủy phòng có tính phí sau khi đặt',
    },
    basePrice: 2100000,
  },
  {
    name: 'Lotte Hotel Hanoi',
    description: 'Nằm ở các tầng trên cùng của tòa nhà Lotte Center tráng lệ, khách sạn mang đến tầm nhìn toàn cảnh thành phố ngoạn mục. Thiết kế nội thất hiện đại kết hợp với truyền thống Việt Nam.',
    address: '54 Liễu Giai, Ba Đình',
    city: 'Hà Nội',
    country: 'Việt Nam',
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490359683-65813fe23760?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Sky Bar (Top of Hanoi)', 'Bể bơi trong nhà', 'Đài quan sát', 'Phòng Gym', 'Yoga', 'Evian Spa'],
    rating: 4.9,
    totalReviews: 200,
    policies: {
      checkIn: '15:00',
      checkOut: '11:00',
      cancellation: 'Không hoàn tiền',
    },
    basePrice: 3200000,
  },
  {
    name: 'Sofitel Legend Metropole Hanoi',
    description: 'Khách sạn lịch sử sang trọng bậc nhất Hà Nội, mang đậm dấu ấn kiến trúc Pháp cổ. Nơi đây từng đón tiếp nhiều nguyên thủ quốc gia và người nổi tiếng thế giới.',
    address: '15 Ngô Quyền, Hoàn Kiếm',
    city: 'Hà Nội',
    country: 'Việt Nam',
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Hồ bơi sân vườn', 'Hầm tránh bom lịch sử', 'Nhà hàng Pháp', 'Bar nhạc Jazz', 'Spa cao cấp'],
    rating: 5.0,
    totalReviews: 350,
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Hủy trước 48h miễn phí',
    },
    basePrice: 5500000,
  }
];

const generateRooms = (hotelId: any, basePrice: number, categories: any[]) => {
  const rooms = [];
  
  // Tầng 1-3: Standard (15 phòng)
  for (let i = 101; i <= 105; i++) rooms.push(createRoom(hotelId, i, categories[0], basePrice, 1));
  for (let i = 201; i <= 205; i++) rooms.push(createRoom(hotelId, i, categories[0], basePrice, 1));
  for (let i = 301; i <= 305; i++) rooms.push(createRoom(hotelId, i, categories[0], basePrice, 1));

  // Tầng 4-6: Deluxe (15 phòng)
  for (let i = 401; i <= 405; i++) rooms.push(createRoom(hotelId, i, categories[1], basePrice * 1.5, 1.2));
  for (let i = 501; i <= 505; i++) rooms.push(createRoom(hotelId, i, categories[1], basePrice * 1.5, 1.2));
  for (let i = 601; i <= 605; i++) rooms.push(createRoom(hotelId, i, categories[1], basePrice * 1.5, 1.2));

  // Tầng 7-8: Suite (6 phòng)
  for (let i = 701; i <= 703; i++) rooms.push(createRoom(hotelId, i, categories[2], basePrice * 2.5, 2));
  for (let i = 801; i <= 803; i++) rooms.push(createRoom(hotelId, i, categories[2], basePrice * 2.5, 2));

  // Tầng 9: President (1 phòng)
  rooms.push(createRoom(hotelId, 901, categories[3], basePrice * 5, 4));

  return rooms;
};

const createRoom = (hotelId: any, roomNum: number, category: any, price: number, sizeMultiplier: number) => {
  const baseSize = 30;
  const isSuite = category.name.includes('Suite');
  
  return {
    hotel: hotelId,
    category: category._id,
    name: `Phòng ${roomNum} - ${category.name}`,
    description: `${category.description} Tầm nhìn ${roomNum % 2 === 0 ? 'thành phố' : 'hồ/vườn'}.`,
    type: isSuite ? 'suite' : (category.name.includes('Deluxe') ? 'deluxe' : 'standard'),
    price: Math.round(price / 10000) * 10000, // Làm tròn
    capacity: {
      adults: isSuite ? 4 : 2,
      children: isSuite ? 2 : 1,
    },
    size: Math.round(baseSize * sizeMultiplier),
    bedType: isSuite ? '2 Giường King' : (category.name.includes('Deluxe') ? '1 Giường King' : '1 Giường Queen'),
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: isSuite 
      ? ['Wifi', 'TV', 'Minibar', 'Bồn tắm', 'Ban công', 'Két sắt', 'Bàn làm việc', 'Máy pha cà phê']
      : ['Wifi', 'TV', 'Minibar', 'Vòi sen', 'Két sắt', 'Bàn làm việc'],
    quantity: 1, // Mỗi số phòng là duy nhất
    isActive: true,
  };
};

const importData = async () => {
  await connectDB();

  try {
    // 1. Xóa dữ liệu cũ (trừ User để tránh mất tài khoản admin)
    console.log('🗑️  Đang xóa dữ liệu cũ...');
    await Hotel.deleteMany({});
    await Room.deleteMany({});
    await RoomCategory.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({}); // Cần xóa booking vì liên kết với phòng cũ

    // 2. Tạo Categories
    console.log('📦 Đang tạo danh mục phòng...');
    const createdCategories = await RoomCategory.insertMany(categoriesData);
    
    // 3. Tạo Hotels và Rooms
    console.log('🏨 Đang tạo khách sạn và phòng...');
    
    for (const hData of hotelsData) {
      // Tách basePrice ra để dùng tính giá phòng, không lưu vào Hotel
      const { basePrice, ...hotelInfo } = hData;
      
      const hotel = await Hotel.create({
        ...hotelInfo,
        priceRange: { min: basePrice, max: basePrice * 5 } // Tạm tính
      });

      const rooms = generateRooms(hotel._id, basePrice, createdCategories);
      await Room.insertMany(rooms);

      // Cập nhật lại số lượng phòng và range giá chính xác cho Hotel
      const minPrice = Math.min(...rooms.map(r => r.price));
      const maxPrice = Math.max(...rooms.map(r => r.price));
      
      await Hotel.findByIdAndUpdate(hotel._id, {
        priceRange: { min: minPrice, max: maxPrice }
      });

      console.log(`   ✅ Đã tạo: ${hotel.name} với ${rooms.length} phòng`);
    }

    console.log('🎉 Import dữ liệu thành công!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

importData();
