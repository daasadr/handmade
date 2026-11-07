import { Controller, Get, Param } from '@nestjs/common';
import { PublicService } from './public.service';

/**
 * Veřejné (NEpřihlášené) read-only endpointy pro výlohu. Schválně BEZ
 * JwtAuthGuard — čte to kdokoli. Data jsou allowlistovaná v PublicService.
 */
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('makers')
  listMakers() {
    return this.publicService.listMakers();
  }

  @Get('makers/:id')
  getMaker(@Param('id') id: string) {
    return this.publicService.getMaker(id);
  }
}
