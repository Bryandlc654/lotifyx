import { Response } from "express";
import { CartService } from "./cart.service";
export declare class CartController {
    private readonly service;
    constructor(service: CartService);
    private getCartId;
    getCart(req: any, res: Response): Promise<{
        cart: import("./cart.entity").Cart;
        items: import("./cart.entity").CartItem[];
    }>;
    addItem(req: any, res: Response, body: any): Promise<import("./cart.entity").CartItem>;
    updateQuantity(req: any, id: string, quantity: number): Promise<import("./cart.entity").CartItem>;
    removeItem(req: any, id: string): Promise<import("./cart.entity").CartItem>;
    clearCart(req: any): Promise<{
        message: string;
    }>;
}
