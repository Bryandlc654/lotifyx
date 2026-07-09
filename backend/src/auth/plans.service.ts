import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { UserProfile } from "./entities/user-profile.entity";

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async getMyPlan(userId: string) {
    const plan = await this.userRepository.query(
      `SELECT sp.*, p.name, p.description, p.price, p.max_products, p.max_featured, p.duration_days
       FROM seller_plans sp
       INNER JOIN plans p ON p.id = sp.plan_id
       WHERE sp.user_id = $1
       ORDER BY sp.created_at DESC LIMIT 1`,
      [userId]
    );
    return plan[0] || null;
  }

  async selectPlan(userId: string, planId: string) {
    const plan = await this.userRepository.query(
      `SELECT id, price, duration_days FROM plans WHERE id = $1 AND is_active = true`,
      [planId]
    );
    if (!plan.length) throw new NotFoundException("Plan no encontrado o no disponible");

    await this.profileRepository.update({ user_id: userId }, { plan_id: planId });

    await this.userRepository.query(
      `UPDATE seller_plans SET status = 'inactive' WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    await this.userRepository.query(
      `INSERT INTO seller_plans (user_id, plan_id, status, payment_status, starts_at, ends_at)
       VALUES ($1, $2, 'active', 'pending', NOW(), NOW() + ($3 || ' days')::INTERVAL)`,
      [userId, planId, plan[0].duration_days || 30]
    );

    return { message: "Plan activado exitosamente" };
  }
}
