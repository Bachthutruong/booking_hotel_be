import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const deleteImage: (publicId: string) => Promise<void>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map