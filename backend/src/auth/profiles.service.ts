import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import { UserProfile } from "./entities/user-profile.entity";

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["profile"],
    });
    if (!user) throw new UnauthorizedException("Usuario no encontrado");
    const { password_hash: _, ...result } = user;
    if (user.role_id) {
      const [roleRow] = await this.userRepository.query(
        `SELECT id, name, is_admin FROM roles WHERE id = $1`, [user.role_id]
      );
      if (roleRow) result.role = roleRow;
    }
    return result;
  }

  async updateProfile(userId: string, dto: any) {
    if (dto.password) {
      const salt = await bcrypt.genSalt(12);
      await this.userRepository.update(userId, { password_hash: await bcrypt.hash(dto.password, salt) });
    }
    if (dto.email || dto.phone) {
      await this.userRepository.update(userId, {
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
      });
    }
    const profileFields: any = {};
    if (dto.first_name !== undefined) profileFields.first_name = dto.first_name;
    if (dto.last_name !== undefined) profileFields.last_name = dto.last_name;
    if (dto.profile_alias !== undefined) profileFields.profile_alias = dto.profile_alias;
    if (dto.avatar_url !== undefined) profileFields.avatar_url = dto.avatar_url;
    if (Object.keys(profileFields).length > 0) {
      await this.profileRepository.update({ user_id: userId }, profileFields);
    }
    return this.getProfile(userId);
  }
}
