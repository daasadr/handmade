import { Global, Module } from '@nestjs/common';
import { RemoveBgService } from './removebg.service';

@Global()
@Module({
  providers: [RemoveBgService],
  exports: [RemoveBgService],
})
export class RemoveBgModule {}
