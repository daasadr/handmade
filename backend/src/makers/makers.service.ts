import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsOptional, IsUrl, IsObject, IsIn, MaxLength } from 'class-validator';
import sanitizeHtml from 'sanitize-html';
import { MakerProfile } from './maker-profile.entity';
import { User } from '../users/user.entity';

/**
 * Očistí HTML z volného editoru profilu. Allowlist: jen bezpečné tagy a styly
 * (barva, zarovnání, font), obrázky jen z http(s). Zahazuje skripty, on* handlery
 * i vše mimo seznam. Běží na serveru PŘED uložením — klient (DOMPurify) je jen
 * druhá obrana, té nevěříme (dá se obejít přímým voláním API). Viz CLAUDE.md 15.3.
 */
export function sanitizeStoryHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3',
      'ul', 'ol', 'li', 'blockquote', 'span', 'a', 'img',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt'],
      '*': ['style'],
    },
    allowedStyles: {
      '*': {
        color: [/^#(0x)?[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],
        'text-align': [/^(left|right|center|justify)$/],
        'font-family': [/^[\w\s"',-]+$/],
      },
    },
    allowedSchemes: ['http', 'https'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      }),
    },
  });
}

export class CreateMakerProfileDto {
  @IsString()
  brandName: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  motto?: string;

  // Mapa { klíčOtázky: odpověď }. Hodnoty hlídá frontend (textová pole); tady
  // jen ověříme, že je to objekt — strukturu drží sdílená šablona na frontendu.
  @IsOptional()
  @IsObject()
  storyAnswers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  storyImages?: Record<string, string>;

  @IsOptional()
  @IsIn(['template', 'custom'])
  storyMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40000)
  storyHtml?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  videoUrl?: string;
}

/**
 * Pro PATCH. Vlastní validovaná třída (ne Partial<CreateMakerProfileDto>) —
 * Partial se za běhu smaže na Object a ValidationPipe přeskočí, takže by prošly
 * cizí klíče i neověřené hodnoty (obří storyHtml, neplatný storyMode). Zde platí
 * stejná pravidla, jen brandName je volitelný.
 */
export class UpdateMakerProfileDto {
  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  motto?: string;

  @IsOptional()
  @IsObject()
  storyAnswers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  storyImages?: Record<string, string>;

  @IsOptional()
  @IsIn(['template', 'custom'])
  storyMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40000)
  storyHtml?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  videoUrl?: string;
}

@Injectable()
export class MakersService {
  constructor(
    @InjectRepository(MakerProfile)
    private profileRepo: Repository<MakerProfile>,
  ) {}

  async getProfile(user: User) {
    const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException('Profil nenalezen');
    return profile;
  }

  async createProfile(user: User, dto: CreateMakerProfileDto) {
    this.sanitizeDto(dto);
    const profile = this.profileRepo.create({ ...dto, userId: user.id });
    return this.profileRepo.save(profile);
  }

  async updateProfile(user: User, dto: UpdateMakerProfileDto) {
    const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException('Profil nenalezen');
    this.sanitizeDto(dto);
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  /** HTML příběhu se ukládá JEN očištěné. Děláme to tady, ať to nejde obejít. */
  private sanitizeDto(dto: { storyHtml?: string }) {
    if (typeof dto.storyHtml === 'string') {
      dto.storyHtml = sanitizeStoryHtml(dto.storyHtml);
    }
  }

  async findById(id: string) {
    return this.profileRepo.findOne({ where: { id } });
  }

  async updateProfileImage(user: User, imageUrl: string) {
    const profile = await this.getProfile(user);
    profile.profileImageUrl = imageUrl;
    return this.profileRepo.save(profile);
  }
}
