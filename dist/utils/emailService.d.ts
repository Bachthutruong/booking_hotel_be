interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare const sendEmail: (options: EmailOptions) => Promise<void>;
export declare const generateVerificationCode: () => string;
export declare const sendVerificationEmail: (email: string, code: string, fullName: string) => Promise<void>;
export declare const sendWelcomeEmail: (email: string, fullName: string) => Promise<void>;
export {};
//# sourceMappingURL=emailService.d.ts.map