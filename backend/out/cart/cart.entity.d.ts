export declare class Cart {
    id: string;
    cart_id: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
}
export declare class CartItem {
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
    price: number;
    regular_price: number;
    image: string;
    title: string;
    sku: string;
    created_at: Date;
}
