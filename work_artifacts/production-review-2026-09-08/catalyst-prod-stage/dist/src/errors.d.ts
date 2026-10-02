export declare class PublicationError extends Error {
    readonly code: string;
    readonly transient: boolean;
    readonly httpStatus: number;
    constructor(message: string, code: string, transient: boolean, httpStatus?: number);
}
export declare function asPublicationError(error: unknown): PublicationError;
