import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BlogPost } from "./blog.entity";

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost) private readonly repo: Repository<BlogPost>,
  ) {}

  findAllPublished() {
    return this.repo.find({
      where: { status: "published" },
      order: { published_at: "DESC" },
      take: 50,
    });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug, status: "published" } });
  }

  findAllAdmin() {
    return this.repo.find({ order: { created_at: "DESC" }, take: 200 });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: Partial<BlogPost>) {
    const title = dto.title || "sin-titulo";
    let slug = dto.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let existing = await this.repo.findOne({ where: { slug } });
    let counter = 1;
    while (existing) {
      slug = `${slug}-${counter++}`;
      existing = await this.repo.findOne({ where: { slug } });
    }
    const post = new BlogPost();
    Object.assign(post, dto, { slug });
    if (dto.status === "published") post.published_at = new Date();
    return this.repo.save(post);
  }

  async update(id: string, dto: Partial<BlogPost>) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException("Artículo no encontrado");
    if (dto.status === "published" && !post.published_at) {
      dto.published_at = new Date();
    }
    return this.repo.save({ ...post, ...dto });
  }

  async remove(id: string) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException("Artículo no encontrado");
    return this.repo.remove(post);
  }
}
