export declare class Product {
    id: string;
    user_id: string;
    category_id: string;
    sku: string;
    title: string;
    specifications: Record<string, any>;
    metodo_pago: string;
    envio_delivery: boolean;
    envio_courier: boolean;
    costo_envio: number;
    tiempo_entrega: string;
    cambios: string;
    devoluciones: string;
    garantia: string;
    politicas_imagenes: string;
    status: string;
    stock: number;
    views: number;
    saves_count: number;
    created_at: Date;
    updated_at: Date;
}
