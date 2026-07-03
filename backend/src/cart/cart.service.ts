import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cart, CartItem } from "./cart.entity";

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private readonly itemRepo: Repository<CartItem>,
  ) {}

  async getOrCreateCart(cartId: string) {
    let cart = await this.cartRepo.findOne({ where: { cart_id: cartId } });
    if (!cart) {
      cart = this.cartRepo.create({ cart_id: cartId });
      cart = await this.cartRepo.save(cart);
    }
    const items = await this.itemRepo.find({ where: { cart_id: cartId }, order: { created_at: "ASC" } });
    return { cart, items };
  }

  async addItem(cartId: string, dto: { product_id: string; title: string; sku?: string; image?: string; price: number; regular_price?: number; quantity?: number }) {
    await this.getOrCreateCart(cartId);
    const existing = await this.itemRepo.findOne({ where: { cart_id: cartId, product_id: dto.product_id } });
    if (existing) {
      existing.quantity += dto.quantity || 1;
      return this.itemRepo.save(existing);
    }
    return this.itemRepo.save(this.itemRepo.create({ cart_id: cartId, ...dto, quantity: dto.quantity || 1 }));
  }

  async updateQuantity(cartId: string, itemId: string, quantity: number) {
    const item = await this.itemRepo.findOne({ where: { id: itemId, cart_id: cartId } });
    if (!item) throw new NotFoundException("Item no encontrado");
    item.quantity = quantity;
    return this.itemRepo.save(item);
  }

  async removeItem(cartId: string, itemId: string) {
    const item = await this.itemRepo.findOne({ where: { id: itemId, cart_id: cartId } });
    if (!item) throw new NotFoundException("Item no encontrado");
    return this.itemRepo.remove(item);
  }

  async clearCart(cartId: string) {
    await this.itemRepo.delete({ cart_id: cartId });
    return { message: "Carrito limpiado" };
  }

  async mergeCart(cartId: string, userId: string) {
    await this.cartRepo.update({ cart_id: cartId }, { user_id: userId });
  }
}
