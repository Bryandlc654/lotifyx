import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AuthModule } from "./auth/auth.module";
import { BlogModule } from "./blog/blog.module";
import { NewsletterModule } from "./newsletter/newsletter.module";
import { TutorialsModule } from "./tutorials/tutorials.module";
import { EventsModule } from "./events/events.module";
import { HelpModule } from "./help/help.module";
import { SupportModule } from "./support/support.module";
import { CartModule } from "./cart/cart.module";
import { PressModule } from "./press/press.module";
import { MailModule } from "./mail/mail.module";
import { BannersModule } from "./banners/banners.module";
import { MarqueesModule } from "./marquees/marquees.module";
import { SettingsModule } from "./settings/settings.module";
import { TestimonialsModule } from "./testimonials/testimonials.module";
import { AdminModule } from "./admin/admin.module";
import { CategoriesModule } from "./categories/categories.module";
import { CategoryFieldsModule } from "./category-fields/category-fields.module";
import { SecondaryBannersModule } from "./secondary-banners/secondary-banners.module";
import { BackingModule } from "./backing/backing.module";
import { PlansModule } from "./plans/plans.module";
import { FaqsModule } from "./faqs/faqs.module";
import { FaqCategoriesModule } from "./faq-categories/faq-categories.module";
import { LeadsModule } from "./leads/leads.module";
import { UploadsModule } from "./uploads/uploads.module";
import { ProductsModule } from "./products/products.module";
import { CheckoutModule } from "./checkout/checkout.module";
import { AuditModule } from "./audit/audit.module";
import { MessagesModule } from "./messages/messages.module";
import { AuthMiddleware } from "./common/middleware/auth.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ─── Rate limiting ──────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60000,        // 1 minuto
        limit: 100,        // 100 requests global
      },
    ]),

    // ─── Cron jobs ──────────────────────────
    ScheduleModule.forRoot(),

    // ─── Static files ───────────────────────
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
      serveStaticOptions: { index: false },
    }),

    // ─── JWT ────────────────────────────────
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "2h" },
      }),
      global: true,
    }),

    // ─── Database ───────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DB_HOST", "localhost"),
        port: config.get<number>("DB_PORT", 5432),
        username: config.get<string>("DB_USERNAME", "postgres"),
        password: config.get<string>("DB_PASSWORD", "postgres"),
        database: config.get<string>("DB_DATABASE", "lotifyx"),
        autoLoadEntities: true,
        synchronize: config.get<string>("NODE_ENV") !== "production",
        extra: { client_encoding: "UTF8" },
      }),
    }),

    AuthModule,
    MailModule,
    BannersModule,
    MarqueesModule,
    SettingsModule,
    TestimonialsModule,
    AdminModule,
    CategoriesModule,
    CategoryFieldsModule,
    SecondaryBannersModule,
    BackingModule,
    PlansModule,
    FaqsModule,
    FaqCategoriesModule,
    LeadsModule,
    UploadsModule,
    ProductsModule,
    CheckoutModule,
    AuditModule,
    BlogModule,
    NewsletterModule,
    TutorialsModule,
    EventsModule,
    HelpModule,
    SupportModule,
    CartModule,
    PressModule,
    MessagesModule,
  ],

  // ─── Global rate limit guard ──────────────
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes("*");
  }
}
