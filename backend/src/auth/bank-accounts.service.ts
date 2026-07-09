import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getBankAccounts(userId: string) {
    return this.userRepository.query(
      `SELECT * FROM bank_accounts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
  }

  async saveBankAccount(userId: string, dto: { bank_name: string; account_number: string; account_holder?: string; account_type?: string }) {
    const result = await this.userRepository.query(
      `INSERT INTO bank_accounts (user_id, bank_name, account_number, account_holder, account_type) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, dto.bank_name, dto.account_number, dto.account_holder || null, dto.account_type || "Cuenta bancaria"]
    );
    return result[0];
  }

  async updateBankAccount(userId: string, accountId: string, dto: { bank_name?: string; account_number?: string; account_holder?: string; account_type?: string }) {
    const raw = await this.userRepository.query(
      `UPDATE bank_accounts SET bank_name = COALESCE($1, bank_name), account_number = COALESCE($2, account_number), account_holder = COALESCE($3, account_holder), account_type = COALESCE($4, account_type) WHERE id = $5 AND user_id = $6 RETURNING *`,
      [dto.bank_name || null, dto.account_number || null, dto.account_holder || null, dto.account_type || null, accountId, userId]
    );
    const rows = Array.isArray(raw?.[0]) ? raw[0] : (raw || []);
    if (!rows.length) throw new NotFoundException("Cuenta no encontrada");
    return rows[0];
  }

  async deleteBankAccount(userId: string, accountId: string) {
    const raw = await this.userRepository.query(
      `DELETE FROM bank_accounts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [accountId, userId]
    );
    const rows = Array.isArray(raw?.[0]) ? raw[0] : (raw || []);
    if (!rows.length) throw new NotFoundException("Cuenta no encontrada");
    return { message: "Cuenta eliminada" };
  }
}
