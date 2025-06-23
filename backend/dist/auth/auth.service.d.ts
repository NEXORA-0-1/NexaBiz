import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    signup(email: string, password: string): Promise<{
        id: number;
        email: string;
        password: string;
        createdAt: Date;
    }>;
    login(email: string, password: string): Promise<{
        token: string;
    }>;
}
