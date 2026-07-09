import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { User } from "../auth/entities/user.entity";
import { AuditService } from "../audit/audit.service";

function isUUID(val: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val); }
import { UserProfile } from "../auth/entities/user-profile.entity";
import { UserVerification } from "../auth/entities/user-verification.entity";

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile) private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(UserVerification) private readonly vfyRepo: Repository<UserVerification>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async findAll(query: { search?: string; role?: string; status?: string; is_admin?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const skip = (page - 1) * limit;
    const params: any[] = [limit, skip];
    const conds: string[] = [];

    const idx = () => params.length + 1;
    if (query.search) { conds.push(`(u.email ILIKE $${idx()} OR up.first_name ILIKE $${idx()} OR up.last_name ILIKE $${idx()})`); params.push(`%${query.search}%`); }
    if (query.role) { conds.push(`r.name = $${idx()}`); params.push(query.role); }
    if (query.status) { conds.push(`u.status = $${idx()}`); params.push(query.status); }
    if (query.is_admin === "true") { conds.push(`r.is_admin = true`); }

    const where = conds.length ? " AND " + conds.join(" AND ") : "";
    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int FROM users u LEFT JOIN roles r ON r.id = u.role_id LEFT JOIN user_profiles up ON up.user_id = u.id WHERE r.name IN ('vendedor','comprador')${where}`,
      params.slice(2),
    );
    const total = Number(count);

    const rows = await this.dataSource.query(
      `SELECT u.id, u.email, u.phone, u.status, u.is_verified, u.created_at, u.updated_at,
              up.first_name, up.last_name, up.document_type, up.document_number, up.account_type,
              r.id AS role_id, r.name AS role_name, r.is_admin AS role_is_admin
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE r.name IN ('vendedor','comprador')${where}
       ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`, params);

    return {
      data: rows.map((r: any) => ({
        id: r.id, email: r.email, phone: r.phone, status: r.status,
        is_verified: r.is_verified, created_at: r.created_at, updated_at: r.updated_at,
        profile: { first_name: r.first_name, last_name: r.last_name, document_type: r.document_type, document_number: r.document_number, account_type: r.account_type },
        role: r.role_id ? { id: r.role_id, name: r.role_name, is_admin: r.role_is_admin } : null,
      })),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Usuario no encontrado");
    const [row] = await this.dataSource.query(
      `SELECT u.id, u.email, u.phone, u.role_id, u.status, u.is_verified, u.created_at, u.updated_at,
              r.name AS role_name, r.is_admin AS role_is_admin,
              up.first_name, up.last_name, up.document_type, up.document_number, up.account_type,
              up.ruc, up.razon_social
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = $1`, [id]
    );
    if (!row) throw new NotFoundException("Usuario no encontrado");
    return {
      id: row.id, email: row.email, phone: row.phone, role_id: row.role_id,
      status: row.status, is_verified: row.is_verified,
      created_at: row.created_at, updated_at: row.updated_at,
      role: row.role_name ? { id: row.role_id, name: row.role_name, is_admin: row.role_is_admin } : null,
      profile: {
        first_name: row.first_name, last_name: row.last_name,
        document_type: row.document_type, document_number: row.document_number,
        account_type: row.account_type, ruc: row.ruc, razon_social: row.razon_social,
      },
    };
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

    const result = await this.findOne(user.id);
    this.audit.log({ action: "user_created", entity: "user", entityId: user.id, details: { email: dto.email, name: `${dto.first_name} ${dto.last_name}` } });
    return result;
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

    const result = await this.findOne(id);
    this.audit.log({ action: "user_updated", entity: "user", entityId: id, details: { changed: Object.keys(dto).filter(k => dto[k] !== undefined) } });
    return result;
  }

  async toggleActive(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Usuario no encontrado");
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    const newStatus = user.status === "disabled" ? "active" : "disabled";
    await this.userRepo.update(id, { status: newStatus });
    const updated = await this.findOne(id);
    this.audit.log({ action: "user_status_changed", entity: "user", entityId: id, details: { from: user.status, to: newStatus } });
    return { ...updated, status: newStatus };
  }

  async remove(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Usuario no encontrado");
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Usuario no encontrado");

    await this.profileRepo.delete({ user_id: id });
    await this.vfyRepo.delete({ user_id: id });
    await this.userRepo.remove(user);
    this.audit.log({ action: "user_deleted", entity: "user", entityId: id, details: { email: user.email } });
    return { message: "Usuario eliminado" };
  }

  async getRoles() {
    return this.userRepo.manager.getRepository("Role").find();
  }
}
