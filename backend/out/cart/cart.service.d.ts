import { Repository } from "typeorm";
import { Cart, CartItem } from "./cart.entity";
export declare class CartService {
    private readonly cartRepo;
    private readonly itemRepo;
    constructor(cartRepo: Repository<Cart>, itemRepo: Repository<CartItem>);
    getOrCreateCart(cartId: string): Promise<{
        cart: Cart;
        items: CartItem[];
    }>;
    addItem(cartId: string, dto: {
        product_id: string;
        title: string;
        sku?: string;
        image?: string;
        price: number;
        regular_price?: number;
        quantity?: number;
    }): Promise<CartItem>;
    updateQuantity(cartId: string, itemId: string, quantity: number): Promise<CartItem>;
    removeItem(cartId: string, itemId: string): Promise<CartItem>;
    clearCart(cartId: string): Promise<{
        message: string;
    }>;
    mergeCart(cartId: string, userId: string): Promise<void>;
}
