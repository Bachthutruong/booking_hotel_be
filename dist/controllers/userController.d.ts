import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadAvatar: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map