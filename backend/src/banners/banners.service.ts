import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Banner } from "./banner.entity";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>
  ) {}

  async findAll() {
    return this.bannerRepository.find({ order: { order_index: "ASC" } });
  }

  async create(title: string, file: Express.Multer.File) {
    const banner = this.bannerRepository.create({
      title,
      image_url: `/uploads/${file.filename}`,
    });

    return this.bannerRepository.save(banner);
  }

  async remove(id: string) {
    const banner = await this.bannerRepository.findOne({ where: { id } });

    if (!banner) {
      throw new NotFoundException("Banner no encontrado");
    }

    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      banner.image_url.replace("/uploads/", "")
    );

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}

    await this.bannerRepository.remove(banner);

    return { message: "Banner eliminado exitosamente" };
  }

  async update(id: string, title?: string, file?: Express.Multer.File) {
    const banner = await this.bannerRepository.findOne({ where: { id } });

    if (!banner) {
      throw new NotFoundException("Banner no encontrado");
    }

    if (title !== undefined) {
      banner.title = title;
    }

    if (file) {
      const oldPath = path.join(
        __dirname, "..", "..", "uploads",
        banner.image_url.replace("/uploads/", "")
      );
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch {}

      banner.image_url = `/uploads/${file.filename}`;
    }

    return this.bannerRepository.save(banner);
  }
}
