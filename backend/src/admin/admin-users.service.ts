import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { User } from "../auth/entities/user.entity";

function isUUID(val: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val); }
import { UserProfile } from "../auth/entities/user-profile.entity";
import { UserVerification } from "../auth/entities/user-verification.entity";

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile) private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(UserVerification) private readonly vfyRepo: Repository<UserVerification>,
  ) {}

  async findAll(query: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const skip = (page - 1) * limit;

    const qb = this.userRepo
      .createQueryBuilder("u")
      .leftJoinAndSelect("u.profile", "p")
      .leftJoinAndSelect("u.role", "r")
      .where("(r.name IS NULL OR r.name != :excludeRole)", { excludeRole: "superadmin" });

    if (query.search) {
      qb.andWhere("(u.email ILIKE :s OR p.first_name ILIKE :s OR p.last_name ILIKE :s OR p.document_number ILIKE :s)", {
        s: `%${query.search}%`,
      });
    }

    if (query.role) {
      qb.andWhere("r.name = :role", { role: query.role });
    }

    if (query.status) {
      qb.andWhere("u.status = :status", { status: query.status });
    }

    qb.orderBy("u.created_at", "DESC").skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((u) => {
        const { password_hash, ...rest } = u;
        return rest;
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Usuario no encontrado");
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ["profile", "role"],
    });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    const { password_hash, ...result } = user;
    return result;
  }

  async create(dto: {
    email: string; password: string; phone?: string; role_id?: string; status?: string;
    first_name: string; last_name: string; document_type?: string; document_number?: string;
  }) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException("El correo ya está registrado");

    const hash = await bcrypt.hash(dto.password, 12);
    const referral = crypto.randomBytes(5).toString("hex").toUpperCase();

    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email, password_hash: hash, phone: dto.phone,
        role_id: dto.role_id, status: dto.status || "active",
        referral_code: referral, is_verified: true,
      })
    );

    await this.profileRepo.save(
      this.profileRepo.create({
        user_id: user.id, first_name: dto.first_name, last_name: dto.last_name,
        document_type: dto.document_type, document_number: dto.document_number,
      })
    );

    return this.findOne(user.id);
  }

  async update(id: string, dto: Partial<{
    email: string; phone: string; role_id: string; status: string; is_verified: boolean;
    first_name: string; last_name: string; document_type: string; document_number: string;
    ruc: string; razon_social: string;
  }>) {
    if (!isUUID(id)) throw new NotFoundException("Usuario no encontrado");
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Usuario no encontrado");

    const userFields: any = {};
    if (dto.email !== undefined) userFields.email = dto.email;
    if (dto.phone !== undefined) userFields.phone = dto.phone;
    if (dto.role_id !== undefined) userFields.role_id = dto.role_id;
    if (dto.status !== undefined) userFields.status = dto.status;
    if (dto.is_verified !== undefined) userFields.is_verified = dto.is_verified;

    if (Object.keys(userFields).length > 0) {
      await this.userRepo.update(id, userFields);
    }

    const profileFields: any = {};
    if (dto.first_name !== undefined) profileFields.first_name = dto.first_name;
    if (dto.last_name !== undefined) profileFields.last_name = dto.last_name;
    if (dto.document_type !== undefined) profileFields.document_type = dto.document_type;
    if (dto.document_number !== undefined) profileFields.document_number = dto.document_number;
    if (dto.ruc !== undefined) profileFields.ruc = dto.ruc;
    if (dto.razon_social !== undefined) profileFields.razon_social = dto.razon_social;

    if (Object.keys(profileFields).length > 0) {
      await this.profileRepo.update({ user_id: id }, profileFields);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Usuario no encontrado");
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Usuario no encontrado");

    await this.profileRepo.delete({ user_id: id });
    await this.vfyRepo.delete({ user_id: id });
    await this.userRepo.remove(user);

    return { message: "Usuario eliminado" };
  }

  async getRoles() {
    return this.userRepo.manager.getRepository("Role").find();
  }
}
