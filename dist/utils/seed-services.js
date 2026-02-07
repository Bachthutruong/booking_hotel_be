"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("../models");
dotenv_1.default.config();
const seedServices = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        // --- Danh mục dịch vụ ---
        const categoriesData = [
            { name: 'Đồ ăn', description: 'Các món ăn, buffet, room service', order: 1 },
            { name: 'Đồ uống', description: 'Nước giải khát, cocktail, café', order: 2 },
            { name: 'Dịch vụ khác', description: 'Spa, giặt ủi, đưa đón, tour', order: 3 },
        ];
        const categories = [];
        for (const cat of categoriesData) {
            let existing = await models_1.ServiceCategory.findOne({ name: cat.name });
            if (!existing) {
                existing = await models_1.ServiceCategory.create({
                    name: cat.name,
                    description: cat.description,
                    order: cat.order,
                    isActive: true,
                });
                console.log('Created category:', cat.name);
            }
            else {
                console.log('Category already exists:', cat.name);
            }
            categories.push({ _id: existing._id, name: existing.name });
        }
        // --- Dịch vụ mẫu (chỉ thêm nếu chưa có dịch vụ nào) ---
        const existingCount = await models_1.Service.countDocuments();
        if (existingCount > 0) {
            console.log(`Already have ${existingCount} services. Skip creating sample services.`);
        }
        else {
            const servicesData = [
                { name: 'Bữa sáng buffet', description: 'Buffet sáng tại nhà hàng', price: 250000, categoryIndex: 0, requiresConfirmation: true },
                { name: 'Bữa trưa set', description: 'Set cơm trưa 3 món', price: 180000, categoryIndex: 0, requiresConfirmation: true },
                { name: 'Room service - Mì Ý', description: 'Mì Ý bò bằm giao tận phòng', price: 120000, categoryIndex: 0, requiresConfirmation: true },
                { name: 'Nước ngọt', description: 'Coca, Pepsi, 7Up', price: 25000, categoryIndex: 1, requiresConfirmation: false },
                { name: 'Bia Tiger', description: 'Bia Tiger 330ml', price: 35000, categoryIndex: 1, requiresConfirmation: true },
                { name: 'Cà phê sáng', description: 'Cà phê phin hoặc máy', price: 45000, categoryIndex: 1, requiresConfirmation: false },
                { name: 'Sinh tố bơ', description: 'Sinh tố bơ tươi', price: 55000, categoryIndex: 1, requiresConfirmation: false },
                { name: 'Massage 60 phút', description: 'Massage body 60 phút', price: 450000, categoryIndex: 2, requiresConfirmation: true },
                { name: 'Giặt ủi 1 bộ', description: 'Giặt ủi 1 bộ đồ', price: 50000, categoryIndex: 2, requiresConfirmation: true },
                { name: 'Đưa đón sân bay', description: 'Một chiều (4 chỗ)', price: 350000, categoryIndex: 2, requiresConfirmation: true },
            ];
            for (const s of servicesData) {
                const category = categories[s.categoryIndex];
                if (!category)
                    continue;
                await models_1.Service.create({
                    category: category._id,
                    name: s.name,
                    description: s.description,
                    price: s.price,
                    isActive: true,
                    requiresConfirmation: s.requiresConfirmation,
                });
                console.log('Created service:', s.name);
            }
            console.log(`Created ${servicesData.length} services`);
        }
        console.log('\n=== Seed services completed ===');
        process.exit(0);
    }
    catch (error) {
        console.error('Seed services error:', error);
        process.exit(1);
    }
};
seedServices();
//# sourceMappingURL=seed-services.js.map