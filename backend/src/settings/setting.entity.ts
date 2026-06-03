import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("settings")
export class Setting {
  @PrimaryColumn({ length: 100 })
  key: string;

  @Column({ type: "text" })
  value: string;

  @UpdateDateColumn()
  updated_at: Date;
}
