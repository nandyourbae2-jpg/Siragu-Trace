-- CreateEnum
CREATE TYPE "BpomType" AS ENUM ('MD', 'ML', 'PIRT');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('HALAL', 'ORGANIC_EU', 'ORGANIC_SNI', 'BPOM', 'OTHER');

-- CreateEnum
CREATE TYPE "TempStatus" AS ENUM ('NO_DATA', 'OK', 'WARNING', 'DEVIATION');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANAGER';

-- AlterTable
ALTER TABLE "Lot" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "bpomNumber" TEXT,
ADD COLUMN     "bpomType" "BpomType",
ADD COLUMN     "distributorName" TEXT,
ADD COLUMN     "grossWeight" DECIMAL(12,3),
ADD COLUMN     "halalCertId" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rhAlarmPct" DECIMAL(5,2) NOT NULL DEFAULT 65,
ADD COLUMN     "tareWeight" DECIMAL(12,3),
ADD COLUMN     "tempAlarmC" DECIMAL(5,2) NOT NULL DEFAULT 27,
ADD COLUMN     "tempMaxNormalC" DECIMAL(5,2) NOT NULL DEFAULT 26,
ADD COLUMN     "tempMinC" DECIMAL(5,2) NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "QrSerial" ADD COLUMN     "boxId" TEXT,
ADD COLUMN     "firstScanAt" TIMESTAMP(3),
ADD COLUMN     "humanSerial" TEXT,
ADD COLUMN     "lastScanAt" TIMESTAMP(3),
ADD COLUMN     "scanCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "token" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "distributorName" TEXT,
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "receivedByName" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "district" TEXT,
ADD COLUMN     "publicConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicName" TEXT,
ADD COLUMN     "village" TEXT;

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issuer" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "verifyUrl" TEXT,
    "fileUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchSequence" (
    "organizationId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BatchSequence_pkey" PRIMARY KEY ("organizationId","day")
);

-- CreateTable
CREATE TABLE "ShipmentLeg" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "fromName" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "departAt" TIMESTAMP(3),
    "arriveAt" TIMESTAMP(3),

    CONSTRAINT "ShipmentLeg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "boxCode" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "loggerStartAt" TIMESTAMP(3),
    "loggerEndAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "buyerId" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" TEXT NOT NULL,
    "qrSerialId" TEXT,
    "boxId" TEXT,
    "kind" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IotDevice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "battery" INTEGER,
    "lastSeenAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IotDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "boxId" TEXT,
    "ts" TIMESTAMP(3) NOT NULL,
    "tempC" DECIMAL(5,2) NOT NULL,
    "rhPct" DECIMAL(5,2),
    "battery" INTEGER,

    CONSTRAINT "TempReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempSummary" (
    "boxId" TEXT NOT NULL,
    "status" "TempStatus" NOT NULL DEFAULT 'NO_DATA',
    "count" INTEGER NOT NULL DEFAULT 0,
    "minC" DECIMAL(5,2),
    "avgC" DECIMAL(5,2),
    "maxC" DECIMAL(5,2),
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "deviationCount" INTEGER NOT NULL DEFAULT 0,
    "deviationMinutes" INTEGER NOT NULL DEFAULT 0,
    "belowRangeCount" INTEGER NOT NULL DEFAULT 0,
    "maxRhPct" DECIMAL(5,2),
    "rhExceedCount" INTEGER NOT NULL DEFAULT 0,
    "firstTs" TIMESTAMP(3),
    "lastTs" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TempSummary_pkey" PRIMARY KEY ("boxId")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "boxId" TEXT,
    "lotId" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Certificate_organizationId_type_idx" ON "Certificate"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentLeg_shipmentId_seq_key" ON "ShipmentLeg"("shipmentId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "Box_token_key" ON "Box"("token");

-- CreateIndex
CREATE INDEX "Box_shipmentId_idx" ON "Box"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Box_organizationId_boxCode_key" ON "Box"("organizationId", "boxCode");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_shipmentId_idx" ON "ShareLink"("shipmentId");

-- CreateIndex
CREATE INDEX "ScanEvent_qrSerialId_createdAt_idx" ON "ScanEvent"("qrSerialId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanEvent_boxId_createdAt_idx" ON "ScanEvent"("boxId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanEvent_createdAt_idx" ON "ScanEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IotDevice_tokenHash_key" ON "IotDevice"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "IotDevice_organizationId_deviceCode_key" ON "IotDevice"("organizationId", "deviceCode");

-- CreateIndex
CREATE INDEX "TempReading_boxId_ts_idx" ON "TempReading"("boxId", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "TempReading_deviceId_ts_key" ON "TempReading"("deviceId", "ts");

-- CreateIndex
CREATE INDEX "Alert_organizationId_status_idx" ON "Alert"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_organizationId_dedupeKey_key" ON "Alert"("organizationId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "PdfSnapshot_docId_key" ON "PdfSnapshot"("docId");

-- CreateIndex
CREATE INDEX "PdfSnapshot_kind_refId_idx" ON "PdfSnapshot"("kind", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_organizationId_batchNumber_key" ON "Lot"("organizationId", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QrSerial_token_key" ON "QrSerial"("token");

-- CreateIndex
CREATE UNIQUE INDEX "QrSerial_humanSerial_key" ON "QrSerial"("humanSerial");

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_halalCertId_fkey" FOREIGN KEY ("halalCertId") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrSerial" ADD CONSTRAINT "QrSerial_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSequence" ADD CONSTRAINT "BatchSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLeg" ADD CONSTRAINT "ShipmentLeg_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_qrSerialId_fkey" FOREIGN KEY ("qrSerialId") REFERENCES "QrSerial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IotDevice" ADD CONSTRAINT "IotDevice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempReading" ADD CONSTRAINT "TempReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempReading" ADD CONSTRAINT "TempReading_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempSummary" ADD CONSTRAINT "TempSummary_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfSnapshot" ADD CONSTRAINT "PdfSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

