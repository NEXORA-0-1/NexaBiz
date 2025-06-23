import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(body: {
        email: string;
        password: string;
    }): Promise<any>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        token: string;
    }>;
}
