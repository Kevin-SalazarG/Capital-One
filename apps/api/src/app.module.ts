import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";

import { environmentSchema } from "./config/environment.schema";
import type { AppEnvironment } from "./config/app-config";
import { AuthInfrastructureModule } from "./common/auth/auth-infrastructure.module";
import { AuditModule } from "./common/audit/audit.module";
import { SupabaseModule } from "./common/database/supabase.module";
import { AppExceptionFilter } from "./common/errors/app-exception.filter";
import { ApiResponseInterceptor } from "./common/http/api-response.interceptor";
import { PermissionGuard } from "./common/authorization/permission.guard";
import { SupabaseJwtGuard } from "./common/auth/supabase-jwt.guard";
import { CsrfGuard } from "./common/auth/csrf.guard";
import { RequestIdMiddleware } from "./common/http/request-id.middleware";
import { BankDataModule } from "./modules/bank-data/bank-data.module";
import { CfdiModule } from "./modules/cfdi/cfdi.module";
import { ConnectionsModule } from "./modules/connections/connections.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ForecastingModule } from "./modules/forecasting/forecasting.module";
import { HealthModule } from "./modules/health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { ObligationsModule } from "./modules/obligations/obligations.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: environmentSchema,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnvironment>) => ({
        throttlers: [
          {
            ttl: config.getOrThrow<number>("RATE_LIMIT_TTL_MS"),
            limit: config.getOrThrow<number>("RATE_LIMIT_LIMIT"),
          },
        ],
      }),
    }),
    SupabaseModule,
    AuditModule,
    AuthInfrastructureModule,
    IdentityModule,
    OrganizationsModule,
    ConnectionsModule,
    BankDataModule,
    CfdiModule,
    ObligationsModule,
    ForecastingModule,
    DashboardModule,
    NotificationsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseJwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes({
      path: "*path",
      method: RequestMethod.ALL,
    });
  }
}
