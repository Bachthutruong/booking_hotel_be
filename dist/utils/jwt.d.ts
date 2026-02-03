import { Response } from 'express';
import { IUser } from '../types';
export declare const generateToken: (id: string) => string;
export declare const sendTokenResponse: (user: IUser, statusCode: number, res: Response) => void;
//# sourceMappingURL=jwt.d.ts.map