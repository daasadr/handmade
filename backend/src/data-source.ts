import { DataSource } from 'typeorm';
import { join } from 'path';
import { config } from 'dotenv';

// For TypeORM CLI usage — load .env from project root
config({ path: join(__dirname, '../../.env') });

import { User } from './users/user.entity';
import { MakerProfile } from './makers/maker-profile.entity';
import { Product } from './products/product.entity';
import { ProductImage } from './products/product-image.entity';
import { AiOptimization } from './ai/ai-optimization.entity';
import { AffiliateLink } from './affiliate/affiliate-link.entity';
import { CharityRecord } from './charity/charity-record.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, MakerProfile, Product, ProductImage, AiOptimization, AffiliateLink, CharityRecord],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
});
