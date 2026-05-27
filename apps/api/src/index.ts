import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import csrf from "@fastify/csrf-protection";
import multipart from "@fastify/multipart";
import { validateEnv, getEnv } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { connectMongoDB, disconnectMongoDB } from "./config/mongodb";
import { initializeTypesenseCollections } from "./config/typesense";
import { errorHandler } from "./middleware/errorHandler";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { authRoutes } from "./routes/auth.routes";
import { healthRoutes } from "./routes/health.routes";
import { engineerProfileRoutes } from "./routes/engineer-profile.routes";
import { companyProfileRoutes } from "./routes/company-profile.routes";
import { searchRoutes } from "./routes/search.routes";
import { buildInPublicRoutes } from "./routes/build-in-public.routes";
import { taskRoutes } from "./routes/task.routes";
import { productRoutes } from "./routes/product.routes";
import { assessmentRoutes } from "./routes/assessment.routes";
import { neuronScoreRoutes } from "./routes/neuron-score.routes";
import { messagingRoutes } from "./routes/messaging.routes";
import { contractRoutes } from "./routes/contract.routes";
import { paymentsRoutes } from "./routes/payments.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { adminRoutes } from "./routes/admin.routes";
import { statsRoutes } from "./routes/stats.routes";
import { featuredRoutes } from "./routes/featured.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { notificationsRoutes } from "./routes/notifications.routes";

async function start() {
  // Validate environment variables
  validateEnv();
  const env = getEnv();

  // Create Fastify instance
  const fastify = Fastify({
    logger: env.NODE_ENV === "development",
    trustProxy: true,
    requestIdHeader: "x-request-id",
    requestIdLogLabel: "requestId",
  });

  // Register plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

  await fastify.register(cors, {
    origin: env.ALLOWED_ORIGINS.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  });

  await fastify.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    },
  });

  await fastify.register(csrf, {
    cookieOpts: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    },
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Global rate limiter
  fastify.addHook("preHandler", globalRateLimiter);

  // Error handler
  fastify.setErrorHandler(errorHandler);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(engineerProfileRoutes, { prefix: "/api/engineer" });
  await fastify.register(companyProfileRoutes, { prefix: "/api/company" });
  await fastify.register(searchRoutes, { prefix: "/api/search" });
  await fastify.register(buildInPublicRoutes, {
    prefix: "/api/build-in-public",
  });
  await fastify.register(taskRoutes, { prefix: "/api" });
  await fastify.register(productRoutes, { prefix: "/api" });
  await fastify.register(assessmentRoutes, { prefix: "/api" });
  await fastify.register(neuronScoreRoutes, { prefix: "/api" });
  await fastify.register(messagingRoutes, { prefix: "/api" });
  await fastify.register(contractRoutes, { prefix: "/api" });
  await fastify.register(paymentsRoutes, { prefix: "/api" });
  await fastify.register(analyticsRoutes, { prefix: "/api" });
  await fastify.register(adminRoutes, { prefix: "/api" });
  await fastify.register(statsRoutes, { prefix: "/api/stats" });
  await fastify.register(featuredRoutes, { prefix: "/api/featured" });
  await fastify.register(dashboardRoutes, { prefix: "/api/dashboard" });
  await fastify.register(settingsRoutes, { prefix: "/api" });
  await fastify.register(notificationsRoutes, { prefix: "/api" });

  // Connect to services
  try {
    await connectDatabase();
    await connectRedis();
  } catch (error) {
    console.error("Failed to connect to required services:", error);
    if (env.NODE_ENV === "development") {
      console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Database / Redis connection failed.

  Quick fix (local):
    1. Copy apps/api/.env.local.example → apps/api/.env.local
    2. Start Postgres: docker compose up -d postgres
    3. Run: cd apps/api && npx prisma db push && npm run seed
    4. Use REDIS_URL=memory:// in .env.local (no Redis needed)

  Or update DATABASE_URL in .env.local with a valid Supabase URL.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }
    process.exit(1);
  }

  try {
    await connectMongoDB();
  } catch (error) {
    if (env.NODE_ENV === "production" && !env.SKIP_MONGODB) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
    console.warn(
      "⚠️  MongoDB unavailable — proctoring event storage disabled",
    );
  }

  try {
    await initializeTypesenseCollections();
  } catch (error) {
    if (env.NODE_ENV === "production" && !env.SKIP_TYPESENSE) {
      console.error("Failed to initialize Typesense:", error);
      process.exit(1);
    }
    console.warn(
      "⚠️  Typesense unavailable — search features will be disabled",
    );
  }

  // Graceful shutdown
  const signals = ["SIGINT", "SIGTERM"];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      await fastify.close();
      await disconnectDatabase();
      await disconnectRedis();
      await disconnectMongoDB();
      process.exit(0);
    });
  });

  // Start server
  try {
    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });
    console.log(`\n🚀 Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`📚 Health check: http://${env.HOST}:${env.PORT}/health`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
