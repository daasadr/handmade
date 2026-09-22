import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  // DataSource.query je jediné, co health() potřebuje — zbytek nemockujeme.
  const makeController = async (query: () => Promise<unknown>) => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getDataSourceToken(), useValue: { query } as Partial<DataSource> },
      ],
    }).compile();
    return module.get<AppController>(AppController);
  };

  describe('health', () => {
    it('vrátí ok, když databáze odpoví', async () => {
      const controller = await makeController(async () => [{ '?column?': 1 }]);
      await expect(controller.health()).resolves.toEqual({ status: 'ok' });
    });

    // Regrese: dřív Nest odpověděl 200 i s mrtvou DB, protože se DB neptal.
    it('vyhodí 503, když dotaz na databázi selže', async () => {
      const controller = await makeController(async () => {
        throw new Error('connection refused');
      });
      await expect(controller.health()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
