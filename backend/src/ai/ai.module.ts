import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiOptimization } from './ai-optimization.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiOptimization, Product, User])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
