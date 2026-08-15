import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("app_config")
export class AppConfig {
  @PrimaryColumn({ length: 100 })
  key: string;

  @Column({ type: "text" })
  value: string;

  @UpdateDateColumn()
  updated_at: Date;
}
