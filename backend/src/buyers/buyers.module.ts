import { Module } from '@nestjs/common';
import { BuyersController } from './buyers.controller.js';
import { BuyersService } from './buyers.service.js';

@Module({
  controllers: [BuyersController],
  providers: [BuyersService],
  exports: [BuyersService],
})
export class BuyersModule {}
