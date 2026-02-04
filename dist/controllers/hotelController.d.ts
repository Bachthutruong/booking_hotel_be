import { Request, Response, NextFunction } from 'express';
export declare const getHotels: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getHotel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createHotel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateHotel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteHotel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadHotelImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getFeaturedHotels: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPopularCities: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateHotelPriceRange: (hotelId: string) => Promise<void>;
export declare const recalculateAllPriceRanges: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=hotelController.d.ts.map