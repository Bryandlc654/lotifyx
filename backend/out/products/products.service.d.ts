import { Repository, DataSource } from "typeorm";
import { Product } from "./product.entity";
import { AuditService } from "../audit/audit.service";
export declare class ProductsService {
    private readonly repo;
    private readonly dataSource;
    private readonly audit;
    constructor(repo: Repository<Product>, dataSource: DataSource, audit: AuditService);
    findAllActive(categoryId?: string, search?: string, limit?: number): Promise<Product[]>;
    findAllAdmin(status?: string, sort?: "ASC" | "DESC", page?: number, limit?: number): Promise<{
        data: Product[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findByUser(userId: string): Promise<Product[]>;
    findOne(id: string): Promise<Product>;
    create(dto: Partial<Product>): Promise<Product>;
    update(id: string, dto: Partial<Product>): Promise<{
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
    } & Product>;
    remove(id: string): Promise<{
        message: string;
    }>;
    approve(id: string): Promise<Product>;
    reject(id: string): Promise<Product>;
    registerView(id: string): Promise<{
        message: string;
    }>;
    toggleSave(productId: string, userId: string): Promise<{
        saved: boolean;
    }>;
    getSaveStatus(productId: string, userId: string): Promise<{
        saved: boolean;
    }>;
}
