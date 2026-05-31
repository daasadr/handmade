import {
  Controller, Post, Get, Body, Headers, RawBodyRequest,
  UseGuards, Req, HttpCode, BadRequestException, Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { IsIn } from 'class-validator';

class CreateCheckoutDto {
  @IsIn(['mini', 'midi', 'max'])
  plan: 'mini' | 'midi' | 'max';
}

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @CurrentUser() user: User,
    @Body() dto: CreateCheckoutDto,
    @Res() res: Response,
  ) {
    const url = await this.billingService.createCheckoutSession(user, dto.plan);
    return res.json({ url });
  }

  @Get('portal')
  @UseGuards(JwtAuthGuard)
  async portal(@CurrentUser() user: User, @Res() res: Response) {
    const url = await this.billingService.createPortalSession(user);
    return res.json({ url });
  }

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('Chybí raw body');
    await this.billingService.handleWebhook(rawBody, sig);
    return { received: true };
  }
}
