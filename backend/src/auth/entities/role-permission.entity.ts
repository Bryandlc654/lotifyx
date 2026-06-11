import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn } from "typeorm";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";

@Entity("role_permissions")
export class RolePermission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  role_id: string;

  @Column()
  permission_id: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @ManyToOne(() => Permission, (perm) => perm.rolePermissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "permission_id" })
  permission: Permission;

  @CreateDateColumn()
  created_at: Date;
}
