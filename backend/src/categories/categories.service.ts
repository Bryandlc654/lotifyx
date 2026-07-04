import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "./category.entity";

function isUUID(val: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val); }

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async findAll() {
    const all = await this.repo.find({
      relations: ["parent", "children"],
      order: { name: "ASC" },
    });

    const roots = all.filter(c => !c.parent_id);
    const map = new Map<string, Category>();
    all.forEach(c => { c.children = []; map.set(c.id, c); });
    all.forEach(c => {
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) parent.children.push(c);
      }
    });

    return roots;
  }

  async findOne(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Categoría no encontrada");
    const cat = await this.repo.findOne({ where: { id }, relations: ["parent", "children"] });
    if (!cat) throw new NotFoundException("Categoría no encontrada");
    return cat;
  }

  async create(dto: any, file?: Express.Multer.File) {
    const exists = await this.repo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException("El slug ya existe");

    return this.repo.save(
      this.repo.create({
        name: dto.name,
        slug: dto.slug,
        icon: file ? file.filename : undefined,
        parent_id: dto.parent_id || undefined,
        status: dto.status || "active",
      })
    );
  }

  async update(id: string, dto: any, file?: Express.Multer.File) {
    if (!isUUID(id)) throw new NotFoundException("Categoría no encontrada");
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException("Categoría no encontrada");

    if (dto.slug && dto.slug !== cat.slug) {
      const exists = await this.repo.findOne({ where: { slug: dto.slug } });
      if (exists) throw new ConflictException("El slug ya existe");
    }

    const data: any = { ...cat, ...dto, parent_id: dto.parent_id ?? cat.parent_id };

    if (file) data.icon = file.filename;

    return this.repo.save(data);
  }

  async remove(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Categoría no encontrada");

    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException("Categoría no encontrada");

    await this.repo.update({ parent_id: id }, { parent_id: null });
    await this.repo.remove(cat);

    return { message: "Categoría eliminada" };
  }
}
