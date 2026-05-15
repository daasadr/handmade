import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email již existuje');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerificationToken = randomBytes(32).toString('hex');

    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      emailVerificationToken,
    });
    await this.usersRepo.save(user);

    await this.emailService.sendVerificationEmail(dto.email, emailVerificationToken);

    return { message: 'Registrace proběhla úspěšně. Zkontrolujte svůj email.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Neplatné přihlašovací údaje');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Neplatné přihlašovací údaje');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        isFoundingMember: user.isFoundingMember,
        emailVerified: user.emailVerified,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepo.findOne({
      where: { emailVerificationToken: token },
    });
    if (!user) throw new BadRequestException('Neplatný nebo expirovaný token');

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await this.usersRepo.save(user);

    return { message: 'Email byl úspěšně ověřen.' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    // Vždy vracíme stejnou odpověď (ochrana před user enumeration)
    if (!user) return { message: 'Pokud účet existuje, byl odeslán reset e-mail.' };

    const token = randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 3600 * 1000); // 1 hodina
    await this.usersRepo.save(user);

    await this.emailService.sendPasswordResetEmail(email, token);

    return { message: 'Pokud účet existuje, byl odeslán reset e-mail.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersRepo.findOne({
      where: { passwordResetToken: token },
    });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Neplatný nebo expirovaný token');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await this.usersRepo.save(user);

    return { message: 'Heslo bylo úspěšně změněno.' };
  }

  getMe(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      isFoundingMember: user.isFoundingMember,
      emailVerified: user.emailVerified,
      aiUsageThisMonth: user.aiUsageThisMonth,
    };
  }
}
