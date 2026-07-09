import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class ReviewsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createReview(userId: string, productId: string, orderId: string, rating: number, comment: string, images: string[]) {
    const [existing] = await this.dataSource.query(
      `SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2 AND order_id = $3`,
      [userId, productId, orderId],
    );
    if (existing) {
      await this.dataSource.query(
        `UPDATE reviews SET rating = $1, comment = $2, images = $3, updated_at = NOW() WHERE id = $4`,
        [rating, comment, images, existing.id],
      );
      return this.dataSource.query(`SELECT * FROM reviews WHERE id = $1`, [existing.id]);
    }
    const [review] = await this.dataSource.query(
      `INSERT INTO reviews (product_id, user_id, order_id, rating, comment, images) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [productId, userId, orderId, rating, comment, images],
    );
    return review;
  }

  async getMyReviews(userId: string) {
    return this.dataSource.query(
      `SELECT r.*, p.title as product_title, p.sku as product_sku,
              o.operation_number, o.created_at as order_date
       FROM reviews r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN orders o ON o.id = r.order_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [userId],
    );
  }

  async getOrderReviews(orderId: string) {
    return this.dataSource.query(
      `SELECT r.*, p.title as product_title, p.sku as product_sku,
              u.email as user_email,
              up.first_name as user_first_name, up.last_name as user_last_name
       FROM reviews r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN user_profiles up ON up.user_id = r.user_id
       WHERE r.order_id = $1 AND r.is_active = true
       ORDER BY r.created_at DESC`,
      [orderId],
    );
  }

  async getProductReviews(productId: string) {
    return this.dataSource.query(
      `SELECT r.*,
              u.email as user_email,
              up.first_name as user_first_name, up.last_name as user_last_name,
              sup.first_name as seller_first_name, sup.last_name as seller_last_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN user_profiles up ON up.user_id = r.user_id
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN user_profiles sup ON sup.user_id = p.user_id
       WHERE r.product_id = $1 AND r.is_active = true
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [productId],
    );
  }

  async getReviewsForSeller(sellerId: string) {
    return this.dataSource.query(
      `SELECT r.*, p.title as product_title, p.sku as product_sku,
              o.operation_number,
              u.email as user_email,
              up.first_name as user_first_name, up.last_name as user_last_name
       FROM reviews r
       INNER JOIN products p ON p.id = r.product_id AND p.user_id = $1
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN user_profiles up ON up.user_id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [sellerId],
    );
  }

  async getAdminReviews(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const [{ count }] = await this.dataSource.query(`SELECT COUNT(*)::int FROM reviews`);
    const rows = await this.dataSource.query(
      `SELECT r.*, p.title as product_title, p.sku as product_sku,
              o.operation_number,
              u.email as user_email,
              up.first_name as user_first_name, up.last_name as user_last_name,
              seller.email as seller_email,
              seller_profile.first_name as seller_first_name,
              seller_profile.last_name as seller_last_name
       FROM reviews r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN user_profiles up ON up.user_id = r.user_id
       LEFT JOIN users seller ON seller.id = p.user_id
       LEFT JOIN user_profiles seller_profile ON seller_profile.user_id = p.user_id
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return { data: rows, total: Number(count), page, totalPages: Math.ceil(Number(count) / limit) };
  }

  async deleteReview(id: string) {
    const [r] = await this.dataSource.query(`SELECT id FROM reviews WHERE id = $1`, [id]);
    if (!r) throw new NotFoundException("Reseña no encontrada");
    await this.dataSource.query(`DELETE FROM reviews WHERE id = $1`, [id]);
    return { message: "Reseña eliminada" };
  }
}
