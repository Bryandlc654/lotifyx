import {
  Controller, Get, Post, Put, Delete, Patch, Param, Body, Req, Res,
  UseGuards, HttpCode, HttpStatus, Query,
  UseInterceptors, UploadedFile, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";
import { Response } from "express";
import * as XLSX from "xlsx";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("products")
export class ProductsController {
  constructor(
    private readonly service: ProductsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get("template")
  downloadTemplate(@Res() res: Response) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Título*", "Categoría*", "Precio", "Marca", "Modelo", "Stock", "Mínimo por pedido (CMC)", "Mínimo por participante (CMC)", "Descripción", "Condición"],
      ["Smart TV 50\"", "Electrónica", "799.00", "Samsung", "UN50TU7000", "10", "1", "1", "TV LED 4K UHD 50 pulgadas", "Nuevo"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=plantilla-productos.xlsx");
    res.send(buf);
  }

  @UseGuards(JwtAuthGuard)
  @Post("bulk")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = "./uploads/temp";
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
        if (!allowed.includes(file.mimetype)) {
          cb(new BadRequestException("Solo archivos Excel (.xlsx, .xls)"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) throw new BadRequestException("Selecciona un archivo Excel para cargar los productos");

    const wb = XLSX.readFile(file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);

    if (rows.length === 0) throw new BadRequestException("El archivo está vacío. Verifica que contenga datos");

    const categories = await this.dataSource.query(`SELECT id, name FROM categories`);
    const catMap: Record<string, string> = {};
    for (const c of categories) {
      catMap[c.name.toLowerCase().trim()] = c.id;
    }

    const created: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = row["Título*"] || row["Título"] || row["Titulo"] || "";
      const categoryName = (row["Categoría*"] || row["Categoría"] || row["Categoria"] || "").toString().trim();
      const price = row["Precio"] || "";
      const marca = row["Marca"] || "";
      const modelo = row["Modelo"] || "";
      const stock = row["Stock"] || "";
      const descripcion = row["Descripción"] || row["Descripcion"] || "";
      const condicion = row["Condición"] || row["Condicion"] || "Nuevo";
      const minQty = parseInt(row["Mínimo por pedido (CMC)"] ?? row["Mínimo por pedido"] ?? row["min_qty"] ?? "") || undefined;
      const cmc = parseInt(row["Mínimo por participante (CMC)"] ?? row["Mínimo por participante"] ?? row["cmc"] ?? "") || undefined;

      if (!title) {
        errors.push({ row: i + 2, error: "Falta título" });
        continue;
      }

      const categoryId = catMap[categoryName.toLowerCase()];
      if (!categoryId) {
        errors.push({ row: i + 2, title, error: `Categoría "${categoryName}" no encontrada` });
        continue;
      }

      try {
        const product = await this.service.create({
          user_id: req.user.id,
          category_id: categoryId,
          stock: parseInt(stock) || 0,
          title,
          min_qty: minQty,
          cmc,
          specifications: {
            Precio: String(price),
            Marca: String(marca),
            Modelo: String(modelo),
            Stock: String(stock),
            Descripción: String(descripcion),
            Condición: String(condicion),
          },
        });
        created.push({ id: product.id, title, category: categoryName });
      } catch (err: any) {
        errors.push({ row: i + 2, title, error: err.message });
      }
    }

    return {
      total: rows.length,
      created: created.length,
      errors: errors.length,
      products: created,
      errorDetails: errors.slice(0, 10),
    };
  }

  @Get()
  findAll(@Query("category_id") categoryId?: string, @Query("search") search?: string, @Query("limit") limit?: number) { return this.service.findAllActive(categoryId, search, limit); }

  @UseGuards(JwtAuthGuard)
  @Get("mine")
  findMine(@Req() req) { return this.service.findByUser(req.user.id); }

  @Post(":id/view")
  @HttpCode(HttpStatus.OK)
  view(@Param("id") id: string, @Req() req) { return this.service.registerView(id, req.user?.id); }

  @UseGuards(JwtAuthGuard)
  @Post(":id/save")
  @HttpCode(HttpStatus.OK)
  toggleSave(@Param("id") id: string, @Req() req) { return this.service.toggleSave(id, req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Get(":id/save-status")
  saveStatus(@Param("id") id: string, @Req() req) { return this.service.getSaveStatus(id, req.user.id); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.service.findOnePublic(id); }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any, @Req() req) {
    return this.service.create({ ...dto, user_id: req.user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any, @Req() req) {
    return this.service.update(id, dto, req.user.id, req.user?.isAdmin || req.user?.role === "superadmin");
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @Req() req) {
    return this.service.remove(id, req.user.id, req.user?.isAdmin || req.user?.role === "superadmin");
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/pause")
  @HttpCode(HttpStatus.OK)
  togglePause(@Param("id") id: string, @Req() req) {
    return this.service.togglePause(id, req.user.id, req.user?.isAdmin || req.user?.role === "superadmin");
  }

  // ─── Variantes ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get(":id/variants")
  getVariants(@Param("id") id: string) {
    return this.service.getVariants(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/variants")
  @HttpCode(HttpStatus.CREATED)
  addVariant(@Param("id") id: string, @Body() dto: any, @Req() req) {
    return this.service.addVariant(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put("variants/:variantId")
  @HttpCode(HttpStatus.OK)
  updateVariant(@Param("variantId") variantId: string, @Body() dto: any, @Req() req) {
    return this.service.updateVariant(variantId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("variants/:variantId")
  @HttpCode(HttpStatus.OK)
  deleteVariant(@Param("variantId") variantId: string, @Req() req) {
    return this.service.deleteVariant(variantId, req.user.id);
  }
}
