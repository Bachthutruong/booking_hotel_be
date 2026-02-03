import { Request } from 'express';
export interface PaginationOptions {
    page: number;
    limit: number;
    skip: number;
}
export declare const getPagination: (req: Request) => PaginationOptions;
export declare const createPaginationResponse: (page: number, limit: number, total: number) => {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};
export declare const calculateNights: (checkIn: Date, checkOut: Date) => number;
export declare const formatPrice: (price: number) => string;
//# sourceMappingURL=helpers.d.ts.map