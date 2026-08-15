-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'DESIGNER', 'PRINTER_OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('DRAFT', 'LIVE', 'FLAGGED');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('PERSONAL_USE', 'COMMERCIAL_USE', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'MATCHED', 'PRINTING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'PAID', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designer_profiles" (
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "portfolioUrl" TEXT,
    "payoutAccountId" TEXT,

    CONSTRAINT "designer_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "printer_profiles" (
    "userId" TEXT NOT NULL,
    "printerModel" TEXT,
    "buildVolumeXMm" DOUBLE PRECISION,
    "buildVolumeYMm" DOUBLE PRECISION,
    "buildVolumeZMm" DOUBLE PRECISION,
    "materialsSupported" TEXT[],
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "avgTurnaroundDays" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "printer_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "models_3d" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "category" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "fileFormat" TEXT NOT NULL,
    "volumeMm3" DOUBLE PRECISION,
    "boundingBoxX" DOUBLE PRECISION,
    "boundingBoxY" DOUBLE PRECISION,
    "boundingBoxZ" DOUBLE PRECISION,
    "priceBase" DECIMAL(10,2) NOT NULL,
    "licenseType" "LicenseType" NOT NULL DEFAULT 'PERSONAL_USE',
    "status" "ModelStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_3d_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_variants" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "scalePercent" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "priceModifier" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "model_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "variantId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimatedPrintTimeMin" INTEGER,
    "estimatedCost" DECIMAL(10,2),
    "finalCost" DECIMAL(10,2),
    "shippingAddress" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "designerPayout" DECIMAL(10,2) NOT NULL,
    "printerPayout" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelId" TEXT,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_job_outcomes" (
    "id" TEXT NOT NULL,
    "printJobId" TEXT NOT NULL,
    "predictedTimeMin" INTEGER,
    "actualTimeMin" INTEGER,
    "predictedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "material" TEXT,
    "infillPercent" DOUBLE PRECISION,
    "layerHeightMm" DOUBLE PRECISION,

    CONSTRAINT "print_job_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE INDEX "models_3d_category_idx" ON "models_3d"("category");

-- CreateIndex
CREATE INDEX "models_3d_status_idx" ON "models_3d"("status");

-- CreateIndex
CREATE INDEX "orders_buyerId_idx" ON "orders"("buyerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "print_jobs_orderId_key" ON "print_jobs"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderId_key" ON "reviews"("orderId");

-- CreateIndex
CREATE INDEX "model_interactions_userId_idx" ON "model_interactions"("userId");

-- CreateIndex
CREATE INDEX "model_interactions_modelId_idx" ON "model_interactions"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "print_job_outcomes_printJobId_key" ON "print_job_outcomes"("printJobId");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designer_profiles" ADD CONSTRAINT "designer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_profiles" ADD CONSTRAINT "printer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models_3d" ADD CONSTRAINT "models_3d_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "designer_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_variants" ADD CONSTRAINT "model_variants_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models_3d"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "model_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printer_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models_3d"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_interactions" ADD CONSTRAINT "model_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_interactions" ADD CONSTRAINT "model_interactions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models_3d"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_job_outcomes" ADD CONSTRAINT "print_job_outcomes_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "print_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
