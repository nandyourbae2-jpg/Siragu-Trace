import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { TraceService } from './trace.service.js';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

class TraceQueryDto {
  @IsOptional()
  @IsEnum(['backward', 'forward', 'both'])
  direction?: 'backward' | 'forward' | 'both' = 'both';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  depth?: number = 1;
}

/**
 * Trace Controller.
 * GET /lots/:id/trace?direction=backward|forward|both&depth=1
 *
 * Initial UI load should always use depth=1 (§63 — don't load entire graph at once).
 * Frontend triggers additional hops via expand clicks.
 */
@Controller('lots')
@UseGuards(JwtAuthGuard)
export class TraceController {
  constructor(private readonly svc: TraceService) {}

  @Get(':id/trace')
  trace(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Query() q: TraceQueryDto,
  ) {
    return this.svc.trace(orgId, id, q.direction ?? 'both', q.depth ?? 1);
  }
}
