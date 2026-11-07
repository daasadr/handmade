import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * Propojení účtu tvůrce s jeho Etsy obchodem (OAuth 2.0).
 *
 * Držíme POUZE refresh token, a to ŠIFROVANĚ (`refreshTokenEnc`, viz TokenCipher).
 * Access token se NEUKLÁDÁ — je krátkodobý (1 h), obnovuje se za běhu z refresh
 * tokenu. Důvod: kdyby unikla DB, krátkodobý token je k ničemu; refresh token je
 * zašifrovaný. Nikdy nelogovat obsah tokenu.
 *
 * 1:1 na uživatele — jeden tvůrce = jeden propojený Etsy obchod.
 */
@Entity('etsy_connections')
export class EtsyConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ unique: true })
  userId: string;

  /** Etsy user id (číslo před tečkou v access tokenu). */
  @Column()
  etsyUserId: string;

  /** Etsy shop id — cíl pro createDraftListing. */
  @Column()
  shopId: string;

  /** Refresh token ŠIFROVANĚ (AES-256-GCM, formát iv.tag.ciphertext). */
  @Column({ type: 'text' })
  refreshTokenEnc: string;

  /** Udělené OAuth scopes (mezerou oddělené), ať víme, co smíme. */
  @Column({ nullable: true })
  scopes: string;

  @CreateDateColumn()
  connectedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
