import { ProductsService } from "../products/products.service";
export declare class AdminProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(status?: string, sort?: "ASC" | "DESC", page?: number, limit?: number): Promise<{
        data: import("../products/product.entity").Product[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    approve(id: string): Promise<import("../products/product.entity").Product>;
    reject(id: string): Promise<import("../products/product.entity").Product>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
