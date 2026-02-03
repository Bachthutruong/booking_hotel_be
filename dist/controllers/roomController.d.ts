import { Request, Response, NextFunction } from 'express';
export declare const getRooms: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getRoom: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createRoom: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateRoom: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteRoom: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadRoomImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const checkAvailability: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAvailableRooms: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=roomController.d.ts.map