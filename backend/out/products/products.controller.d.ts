import { Response } from "express";
import { DataSource } from "typeorm";
import { ProductsService } from "./products.service";
export declare class ProductsController {
    private readonly service;
    private readonly dataSource;
    constructor(service: ProductsService, dataSource: DataSource);
    downloadTemplate(res: Response): void;
    bulkCreate(file: Express.Multer.File, req: any): Promise<{
        total: number;
        created: number;
        errors: number;
        products: any[];
        errorDetails: any[];
    }>;
    findAll(categoryId?: string, search?: string, limit?: number): Promise<import("./product.entity").Product[]>;
    findMine(req: any): Promise<import("./product.entity").Product[]>;
    view(id: string): Promise<{
        message: string;
    }>;
    toggleSave(id: string, req: any): Promise<{
        saved: boolean;
    }>;
    saveStatus(id: string, req: any): Promise<{
        saved: boolean;
    }>;
    findOne(id: string): Promise<import("./product.entity").Product>;
    create(dto: any, req: any): Promise<import("./product.entity").Product>;
    update(id: string, dto: any): Promise<{
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
    } & import("./product.entity").Product>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
