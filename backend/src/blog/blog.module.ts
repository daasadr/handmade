import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost } from './blog-post.entity';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogPublicController } from './blog-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost])],
  controllers: [BlogController, BlogPublicController],
  providers: [BlogService],
})
export class BlogModule {}
