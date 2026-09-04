import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { MlModule } from './ml/ml.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';
import { PrintersModule } from './printers/printers.module';
import { MatchingModule } from './matching/matching.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { SocialModule } from './social/social.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    StorageModule,
    MlModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    OrdersModule,
    PrintersModule,
    MatchingModule,
    PaymentsModule,
    ReviewsModule,
    AdminModule,
    SocialModule,
  ],
  controllers: [HealthController],
  providers: [
    // Registering ThrottlerModule alone does NOT enforce anything — it
    // just makes the options available. The actual enforcement only
    // happens once ThrottlerGuard runs on every request, which requires
    // this APP_GUARD registration. Without it, the module loads
    // successfully (shows up in the startup log) but silently throttles
    // zero requests — a real gap that was present before this fix.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}