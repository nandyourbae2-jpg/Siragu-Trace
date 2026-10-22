import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { LotsModule } from './lots/lots.module.js';
import { ProcessEventsModule } from './process-events/process-events.module.js';
import { TraceModule } from './trace/trace.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { BuyersModule } from './buyers/buyers.module.js';
import { QualityModule } from './quality/quality.module.js';
import { PackagingModule } from './packaging/packaging.module.js';
import { DistributionModule } from './distribution/distribution.module.js';
import { IotModule } from './iot/iot.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { CertificatesModule } from './certificates/certificates.module.js';
import { PublicModule } from './public/public.module.js';
import { TenantScopeInterceptor } from './auth/tenant-scope.interceptor.js';
import { CommonModule } from './common/common.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    LotsModule,
    ProcessEventsModule,
    TraceModule,
    SuppliersModule,
    BuyersModule,
    QualityModule,
    PackagingModule,
    DistributionModule,
    IotModule,
    ReportsModule,
    CertificatesModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global tenant isolation interceptor — runs on every authenticated request.
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantScopeInterceptor,
    },
  ],
})
export class AppModule {}
