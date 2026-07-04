import { Repository } from "typeorm";
import { RefreshToken } from "../../auth/entities/refresh-token.entity";
export declare class CleanupService {
    private readonly refreshTokenRepo;
    constructor(refreshTokenRepo: Repository<RefreshToken>);
    cleanupExpiredTokens(): Promise<void>;
}
