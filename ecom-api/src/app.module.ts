import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CacheModule } from "@/cache/cache.module";
import { StorageModule } from "@/storage/storage.module";
import { HealthModule } from "@/health/health.module";
import { ScheduleModule } from "@nestjs/schedule";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";
import { AdminAuthModule } from "@/modules/auth/admin/admin-auth.module";
import { StoreAuthModule } from "@/modules/auth/store/store-auth.module";
import { MailModule } from "@/infrastructure/mail/mail.module";
import { PasswordResetModule } from "@/modules/auth/reset/password-reset.module";
import { AuthRateLimitModule } from "@/modules/auth/rate-limit/auth-rate-limit.module";
import { AdminModule } from "@/modules/admin/admin.module";
import { RedisModule } from "@nestjs-modules/ioredis";
import { redisConfig } from "@/config/redis.config";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { StoreCartModule } from "@/modules/cart/cart.module";
import { CustomersStoreModule } from "@/modules/customers/customers.store.module";
import { CheckoutModule } from "@/modules/checkout/checkout.module";
import { SecurityModule } from "@/infrastructure/security/security.module";
import { OrdersModule } from "@/modules/orders/order.module";
import { PaymentsModule } from "@/modules/payments/payment.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { InventoryModule } from "@/modules/inventory/inventory.module";
import { FilesModule } from "./modules/files/files.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { PricingModule } from "./modules/pricing/pricing.module";

@Module({
  imports: [
    SecurityModule,
    PrismaModule,
    CacheModule,
    StorageModule,
    HealthModule,
    ScheduleModule.forRoot(),
    TenantBootstrapModule,
    AdminAuthModule,
    StoreAuthModule,
    MailModule,
    PasswordResetModule,
    AuthRateLimitModule,
    AdminModule,
    RedisModule.forRoot(redisConfig),
    CatalogModule,
    StoreCartModule,
    CustomersStoreModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    SessionsModule,
    InventoryModule,
    FilesModule,
    ShippingModule,
    PricingModule,
  ],
})
export class AppModule {}
