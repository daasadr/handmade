import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Zdravotní kontrola pro externího hlídače (/api/health).
   *
   * Ptá se i DATABÁZE, ne jen aplikace: Nest odpoví na HTTP i s mrtvou DB,
   * takže „appka odpověděla" bez dotazu na DB nic neznamená. Ven jde jen
   * ano/ne + HTTP kód (200 / 503), detaily do logu — hlídač nemá co řešit
   * kromě „žije / nežije". (Bod 08 příručky: o výpadku se musíš dozvědět
   * dřív než zákazník.)
   */
  @Get('health')
  async health(): Promise<{ status: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok' };
    } catch (err) {
      console.error('[health] DB check failed:', err);
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
