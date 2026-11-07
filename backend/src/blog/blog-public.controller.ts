import { Controller, Get, Param } from '@nestjs/common';
import { BlogService } from './blog.service';

/** Veřejné (NEpřihlášené) čtení blogu — jen publikované články. */
@Controller('public/blog')
export class BlogPublicController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  list() {
    return this.blogService.listPublished();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.blogService.getPublishedBySlug(slug);
  }
}
