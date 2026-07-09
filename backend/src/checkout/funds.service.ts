import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class FundsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async getFunds(userId: string) {
    const [funds] = await this.dataSource.query(
      `SELECT COALESCE(available_balance, 0) AS available_balance,
              COALESCE(pending_balance, 0) AS pending_balance,
              COALESCE(disputed_balance, 0) AS disputed_balance
       FROM funds WHERE user_id = $1::uuid`,
      [userId],
    );

    if (!funds) {
      await this.dataSource.query(
        `INSERT INTO funds (user_id, available_balance, pending_balance, disputed_balance) VALUES ($1::uuid, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      );
      return { available_balance: 0, pending_balance: 0, disputed_balance: 0 };
    }

    return {
      available_balance: Number(funds.available_balance),
      pending_balance: Number(funds.pending_balance),
      disputed_balance: Number(funds.disputed_balance),
    };
  }

  async getWithdrawals(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int FROM withdrawals WHERE user_id = $1::uuid`,
      [userId],
    );
    const rows = await this.dataSource.query(
      `SELECT * FROM withdrawals WHERE user_id = $1::uuid ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return { data: rows, total: Number(count), page, totalPages: Math.ceil(Number(count) / limit) };
  }

  async requestWithdrawal(userId: string, data: { amount: number; bank_name: string; account_number: string; account_holder: string }) {
    if (data.amount <= 0) throw new BadRequestException("Monto inválido");

    const [funds] = await this.dataSource.query(
      `SELECT available_balance FROM funds WHERE user_id = $1::uuid FOR UPDATE`,
      [userId],
    );
    if (!funds || Number(funds.available_balance) < data.amount) {
      throw new BadRequestException("Saldo insuficiente");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `UPDATE funds SET available_balance = available_balance - $1, pending_balance = pending_balance + $1 WHERE user_id = $2::uuid`,
        [data.amount, userId],
      );
      await queryRunner.query(
        `INSERT INTO withdrawals (user_id, amount, status, bank_name, account_number, account_holder) VALUES ($1::uuid, $2, 'pending', $3, $4, $5)`,
        [userId, data.amount, data.bank_name, data.account_number, data.account_holder],
      );
      await queryRunner.commitTransaction();
      this.audit.log({ userId, action: "withdrawal_requested", entity: "funds", details: { amount: data.amount } });
      return { message: "Solicitud de retiro enviada" };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async processWithdrawal(id: string, status: string) {
    if (!["approved", "rejected"].includes(status)) throw new BadRequestException("Estado inválido");
    const [w] = await this.dataSource.query(
      `SELECT * FROM withdrawals WHERE id = $1::uuid`,
      [id],
    );
    if (!w) throw new NotFoundException("Retiro no encontrado");
    if (w.status !== "pending") throw new BadRequestException("El retiro ya fue procesado");

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (status === "rejected") {
        await queryRunner.query(
          `UPDATE funds SET available_balance = available_balance + $1, pending_balance = pending_balance - $1 WHERE user_id = $2::uuid`,
          [w.amount, w.user_id],
        );
      } else {
        await queryRunner.query(
          `UPDATE funds SET pending_balance = pending_balance - $1 WHERE user_id = $2::uuid`,
          [w.amount, w.user_id],
        );
      }
      await queryRunner.query(
        `UPDATE withdrawals SET status = $1, processed_at = NOW() WHERE id = $2::uuid`,
        [status, id],
      );
      await queryRunner.commitTransaction();
      this.audit.log({ action: "withdrawal_processed", entity: "funds", entityId: id, details: { status } });
      return { message: `Retiro ${status === "approved" ? "aprobado" : "rechazado"}` };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllWithdrawals(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int FROM withdrawals`,
    );
    const rows = await this.dataSource.query(
      `SELECT w.*, up.first_name, up.last_name, u.email
       FROM withdrawals w
       LEFT JOIN users u ON u.id = w.user_id
       LEFT JOIN user_profiles up ON up.user_id = w.user_id
       ORDER BY w.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return { data: rows, total: Number(count), page, totalPages: Math.ceil(Number(count) / limit) };
  }

  async toggleWithdrawalDeposit(id: string) {
    const [w] = await this.dataSource.query(
      `SELECT * FROM withdrawals WHERE id = $1::uuid`,
      [id],
    );
    if (!w) throw new NotFoundException("Retiro no encontrado");
    if (w.status !== "approved" && w.status !== "completed") throw new BadRequestException("El retiro debe estar aprobado para gestionar el depósito");

    const newConfirmed = !w.deposit_confirmed;
    await this.dataSource.query(
      `UPDATE withdrawals SET deposit_confirmed = $1, deposit_confirmed_at = CASE WHEN $1 THEN NOW() ELSE NULL END, status = CASE WHEN $1 THEN 'completed' ELSE 'approved' END, updated_at = NOW() WHERE id = $2::uuid`,
      [newConfirmed, id],
    );
    this.audit.log({ action: "withdrawal_deposit_toggled", entity: "funds", entityId: id, details: { deposit_confirmed: newConfirmed } });
    return { message: newConfirmed ? "Depósito confirmado" : "Depósito marcado como pendiente" };
  }
}
