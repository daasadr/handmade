import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { User, UserPlan } from '../users/user.entity';

const PLAN_PRICE_IDS: Record<string, string> = {
  mini: process.env.STRIPE_PRICE_MINI || '',
  midi: process.env.STRIPE_PRICE_MIDI || '',
  max: process.env.STRIPE_PRICE_MAX || '',
};

const STRIPE_PLAN_MAP: Record<string, UserPlan> = {
  [process.env.STRIPE_PRICE_MINI || 'price_mini']: UserPlan.MINI,
  [process.env.STRIPE_PRICE_MIDI || 'price_midi']: UserPlan.MIDI,
  [process.env.STRIPE_PRICE_MAX || 'price_max']: UserPlan.MAX,
};

@Injectable()
export class BillingService {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2026-05-27.dahlia',
  });
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private async getOrCreateCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });

    await this.userRepo.update(user.id, { stripeCustomerId: customer.id });
    return customer.id;
  }

  async createCheckoutSession(user: User, plan: string): Promise<string> {
    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) throw new BadRequestException(`Neznámý plán: ${plan}`);

    const customerId = await this.getOrCreateCustomer(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${frontendUrl}/dashboard?upgrade=success`,
      cancel_url: `${frontendUrl}/tarify?upgrade=cancelled`,
      metadata: { userId: user.id, plan },
    });

    return session.url!;
  }

  async createPortalSession(user: User): Promise<string> {
    if (!user.stripeCustomerId) {
      throw new BadRequestException('Nemáte aktivní předplatné');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}/profile`,
    });

    return session.url;
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET ?? '',
      );
    } catch {
      throw new BadRequestException('Neplatný webhook podpis');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionChange(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleCheckoutCompleted(session: any) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
      { expand: ['items.data.price'] },
    );

    const priceId = subscription.items.data[0].price.id;
    const plan = STRIPE_PLAN_MAP[priceId] || UserPlan.FREE;

    await this.userRepo.update(userId, { plan });
    this.logger.log(`User ${userId} upgraded to ${plan}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleSubscriptionChange(subscription: any) {
    const customerId = subscription.customer as string;
    const user = await this.userRepo.findOne({ where: { stripeCustomerId: customerId } });
    if (!user) return;

    const priceId = subscription.items.data[0].price.id;
    const plan = STRIPE_PLAN_MAP[priceId] || UserPlan.FREE;

    await this.userRepo.update(user.id, { plan });
    this.logger.log(`User ${user.id} plan changed to ${plan}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleSubscriptionDeleted(subscription: any) {
    const customerId = subscription.customer as string;
    const user = await this.userRepo.findOne({ where: { stripeCustomerId: customerId } });
    if (!user) return;

    await this.userRepo.update(user.id, { plan: UserPlan.FREE });
    this.logger.log(`User ${user.id} downgraded to free (subscription cancelled)`);
  }
}
