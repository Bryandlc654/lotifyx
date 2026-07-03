import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "../auth/entities/role.entity";
import { Permission } from "../auth/entities/permission.entity";
import { RolePermission } from "../auth/entities/role-permission.entity";

@Injectable()
export class AdminRbacService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rpRepo: Repository<RolePermission>,
  ) {}

  // --- Roles ---
  async getRoles() {
    return this.roleRepo.find({
      where: { is_admin: true },
      relations: ["rolePermissions", "rolePermissions.permission"],
    });
  }

  async createRole(dto: { name: string; description?: string }) {
    const exists = await this.roleRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException("El rol ya existe");
    return this.roleRepo.save(this.roleRepo.create({ name: dto.name, description: dto.description, is_admin: true }));
  }

  async deleteRole(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException("Rol no encontrado");
    if (role.name === "superadmin") throw new ConflictException("No se puede eliminar el rol superadmin");
    await this.roleRepo.remove(role);
    return { message: "Rol eliminado" };
  }

  // --- Permissions ---
  async getPermissions() {
    return this.permRepo.find({ order: { module: "ASC", name: "ASC" } });
  }

  async createPermission(dto: { name: string; description: string; module: string }) {
    const exists = await this.permRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException("El permiso ya existe");
    return this.permRepo.save(this.permRepo.create(dto));
  }

  async deletePermission(id: string) {
    const perm = await this.permRepo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException("Permiso no encontrado");
    await this.permRepo.remove(perm);
    return { message: "Permiso eliminado" };
  }

  // --- Role-Permission assignments ---
  async getRolePermissions(roleId: string) {
    return this.rpRepo.find({
      where: { role_id: roleId },
      relations: ["permission"],
    });
  }

  async assignPermission(roleId: string, permissionId: string) {
    const exists = await this.rpRepo.findOne({ where: { role_id: roleId, permission_id: permissionId } });
    if (exists) return exists;
    return this.rpRepo.save(this.rpRepo.create({ role_id: roleId, permission_id: permissionId }));
  }

  async revokePermission(rolePermissionId: string) {
    const rp = await this.rpRepo.findOne({ where: { id: rolePermissionId } });
    if (!rp) throw new NotFoundException("Asignación no encontrada");
    await this.rpRepo.remove(rp);
    return { message: "Permiso revocado" };
  }

  // --- Seed default permissions ---
  async seedDefaultPermissions() {
    const defaults = [
      { name: "banners.read", description: "Ver banners", module: "banners" },
      { name: "banners.write", description: "Crear/editar banners", module: "banners" },
      { name: "banners.delete", description: "Eliminar banners", module: "banners" },
      { name: "marquees.read", description: "Ver logos", module: "marquees" },
      { name: "marquees.write", description: "Crear/editar logos", module: "marquees" },
      { name: "marquees.delete", description: "Eliminar logos", module: "marquees" },
      { name: "testimonials.read", description: "Ver testimonios", module: "testimonials" },
      { name: "testimonials.write", description: "Crear/editar testimonios", module: "testimonials" },
      { name: "testimonials.delete", description: "Eliminar testimonios", module: "testimonials" },
      { name: "categories.read", description: "Ver categorías", module: "categories" },
      { name: "categories.write", description: "Crear/editar categorías", module: "categories" },
      { name: "categories.delete", description: "Eliminar categorías", module: "categories" },
      { name: "users.read", description: "Ver usuarios", module: "users" },
      { name: "users.write", description: "Crear/editar usuarios", module: "users" },
      { name: "users.delete", description: "Eliminar usuarios", module: "users" },
      { name: "plans.read", description: "Ver planes", module: "plans" },
      { name: "plans.write", description: "Crear/editar planes", module: "plans" },
      { name: "plans.delete", description: "Eliminar planes", module: "plans" },
      { name: "settings.read", description: "Ver configuración", module: "settings" },
      { name: "settings.write", description: "Editar configuración", module: "settings" },
      { name: "backing.read", description: "Ver logos respaldo", module: "backing" },
      { name: "backing.write", description: "Crear/editar logos respaldo", module: "backing" },
      { name: "backing.delete", description: "Eliminar logos respaldo", module: "backing" },
      { name: "secondary_banners.read", description: "Ver banners promo", module: "secondary_banners" },
      { name: "secondary_banners.write", description: "Crear/editar banners promo", module: "secondary_banners" },
      { name: "secondary_banners.delete", description: "Eliminar banners promo", module: "secondary_banners" },
      { name: "rbac.read", description: "Ver roles y permisos", module: "rbac" },
      { name: "rbac.write", description: "Gestionar roles y permisos", module: "rbac" },
      { name: "faqs.read", description: "Ver FAQs", module: "faqs" },
      { name: "faqs.write", description: "Crear/editar FAQs", module: "faqs" },
      { name: "faqs.delete", description: "Eliminar FAQs", module: "faqs" },
      { name: "newsletter.read", description: "Ver suscriptores newsletter", module: "newsletter" },
      { name: "tutorials.read", description: "Ver tutoriales", module: "tutorials" },
      { name: "tutorials.write", description: "Crear/editar tutoriales", module: "tutorials" },
      { name: "tutorials.delete", description: "Eliminar tutoriales", module: "tutorials" },
      { name: "events.read", description: "Ver eventos", module: "events" },
      { name: "events.write", description: "Crear/editar eventos", module: "events" },
      { name: "events.delete", description: "Eliminar eventos", module: "events" },
      { name: "help.read", description: "Ver artículos ayuda", module: "help" },
      { name: "help.write", description: "Crear/editar artículos ayuda", module: "help" },
      { name: "help.delete", description: "Eliminar artículos ayuda", module: "help" },
      { name: "support.read", description: "Ver tickets soporte", module: "support" },
      { name: "support.write", description: "Responder tickets soporte", module: "support" },
      { name: "press.read", description: "Ver notas de prensa", module: "press" },
      { name: "press.write", description: "Crear/editar notas de prensa", module: "press" },
      { name: "press.delete", description: "Eliminar notas de prensa", module: "press" },
      { name: "leads.read", description: "Ver leads", module: "leads" },
      { name: "leads.delete", description: "Eliminar leads", module: "leads" },
      { name: "faq_categories.read", description: "Ver categorías FAQ", module: "faq_categories" },
      { name: "faq_categories.write", description: "Crear/editar categorías FAQ", module: "faq_categories" },
      { name: "faq_categories.delete", description: "Eliminar categorías FAQ", module: "faq_categories" },
      { name: "category_fields.read", description: "Ver campos de categoría", module: "category_fields" },
      { name: "category_fields.write", description: "Crear/editar campos de categoría", module: "category_fields" },
      { name: "category_fields.delete", description: "Eliminar campos de categoría", module: "category_fields" },
      { name: "products.read", description: "Ver productos", module: "products" },
      { name: "products.write", description: "Crear/editar productos", module: "products" },
      { name: "products.delete", description: "Eliminar productos", module: "products" },
      { name: "products.approve", description: "Aprobar/rechazar productos", module: "products" },
      { name: "blog.write", description: "Gestionar blog", module: "blog" },
      { name: "orders.read", description: "Ver historial de ventas", module: "orders" },
      { name: "orders.approve", description: "Aprobar pagos de pedidos", module: "orders" },
      { name: "messages.read", description: "Ver mensajes", module: "messages" },
      { name: "messages.write", description: "Enviar mensajes", module: "messages" },
    ];

    let created = 0;
    for (const d of defaults) {
      const exists = await this.permRepo.findOne({ where: { name: d.name } });
      if (!exists) {
        await this.permRepo.save(this.permRepo.create(d));
        created++;
      }
    }

    // Assign all to superadmin and set is_admin
    const superadmin = await this.roleRepo.findOne({ where: { name: "superadmin" } });
    if (superadmin) {
      if (!superadmin.is_admin) {
        await this.roleRepo.update(superadmin.id, { is_admin: true });
      }
      const allPerms = await this.permRepo.find();
      for (const perm of allPerms) {
        const exists = await this.rpRepo.findOne({ where: { role_id: superadmin.id, permission_id: perm.id } });
        if (!exists) {
          await this.rpRepo.save(this.rpRepo.create({ role_id: superadmin.id, permission_id: perm.id }));
        }
      }
    }

    return { message: `Creados ${created} permisos. Superadmin actualizado.` };
  }
}
