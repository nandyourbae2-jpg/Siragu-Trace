import { Module } from '@nestjs/common';
import { PublicController } from './public.controller.js';
import { PublicService } from './public.service.js';
import { PdfService } from './pdf.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PublicController],
  providers: [PublicService, PdfService],
  exports: [PublicService, PdfService],
})
export class PublicModule {}
