import {
  PrismaClient,
  LotType,
  RelationType,
  ProcessEventType,
  LotStatus,
  QualityStatus,
  Role,
  PackageStatus,
  QrStatus,
  ShipmentStatus,
  BpomType,
  CertificateType,
  TempStatus,
  VisibilityLevel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { simulateReadings, summarize, DEFAULT_SPEC } from '../src/iot/temp-scoring.js';
import { generateToken } from '../src/common/crockford.js';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY VIOLATION: prisma db seed cannot run when NODE_ENV=production!');
  }

  console.log('🌱 Seeding SIRAGU Trace - Production Golden Path (Organik Coconut Sugar)...');

  // 1. Clean up existing tables
  await prisma.scanEvent.deleteMany();
  await prisma.tempReading.deleteMany();
  await prisma.tempSummary.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.qrSerial.deleteMany();
  await prisma.package.deleteMany();
  await prisma.box.deleteMany();
  await prisma.shipmentLeg.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.shipmentLine.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.lotRelation.deleteMany();
  await prisma.processEventInput.deleteMany();
  await prisma.processEventOutput.deleteMany();
  await prisma.processEvent.deleteMany();
  await prisma.lotEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.iotDevice.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.gateway.deleteMany();
  await prisma.batchSequence.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.location.deleteMany();
  await prisma.site.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 2. Organization & Sites
  const org = await prisma.organization.create({
    data: {
      name: 'Koperasi Produsen Siragu Organik Nusantara',
      isDemo: true,
    },
  });

  const siteCentral = await prisma.site.create({
    data: {
      organizationId: org.id,
      name: 'Pabrik Pengolahan Gula Banyumas',
      address: 'Jl. Raya Somagede No. 45, Banyumas, Jawa Tengah',
    },
  });

  const locReceiving = await prisma.location.create({
    data: { siteId: siteCentral.id, name: 'Pos Penerimaan Nira', type: 'WAREHOUSE' },
  });
  const locOven = await prisma.location.create({
    data: { siteId: siteCentral.id, name: 'Lantai Kristalisasi & Oven Pengering', type: 'PROCESSING' },
  });
  const locPackaging = await prisma.location.create({
    data: { siteId: siteCentral.id, name: 'Ruang Kemas Higienis', type: 'PROCESSING' },
  });
  const locWarehouse = await prisma.location.create({
    data: { siteId: siteCentral.id, name: 'Gudang Distribusi Jadi', type: 'WAREHOUSE' },
  });

  // 3. Users with Roles
  const standardPassword = await bcrypt.hash('Siragu2026!', 10);
  const demoLegacyPassword = await bcrypt.hash('demo1234', 10);

  const owner = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Arjun Rajan (Direktur Operasional)',
      email: 'owner@siragu.id',
      role: Role.OWNER,
      passwordHash: standardPassword,
    },
  });

  const qaUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Dewi Sartika (Kepala Jaminan Mutu)',
      email: 'qa@siragu.id',
      role: Role.QA,
      passwordHash: standardPassword,
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Priya Kumar (Operator Lapangan & Produksi)',
      email: 'operator@siragu.id',
      role: Role.OPERATOR,
      passwordHash: standardPassword,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Budi Santoso (Manajer Rantai Pasok)',
      email: 'manager@siragu.id',
      role: Role.MANAGER,
      passwordHash: standardPassword,
    },
  });

  // Legacy demo users for backward compatibility
  await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Demo Owner',
      email: 'owner@siragu.demo',
      role: Role.OWNER,
      passwordHash: demoLegacyPassword,
    },
  });

  await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Demo Operator',
      email: 'operator@siragu.demo',
      role: Role.OPERATOR,
      passwordHash: demoLegacyPassword,
    },
  });

  // 4. Certificates Vault (Single Source of Truth)
  const certHalal = await prisma.certificate.create({
    data: {
      organizationId: org.id,
      type: CertificateType.HALAL,
      name: 'Sertifikat Halal BPJPH',
      number: 'ID33110001892830224',
      issuer: 'Badan Penyelenggara Jaminan Produk Halal (BPJPH)',
      validUntil: new Date('2028-11-10T23:59:59Z'),
      verifyUrl: 'https://bpjph.halal.go.id/search_prod',
      fileUrl: '/certificates/halal-siragu-2028.pdf',
      isDemo: true,
    },
  });

  await prisma.certificate.create({
    data: {
      organizationId: org.id,
      type: CertificateType.ORGANIC_EU,
      name: 'Sertifikat Organik Standar Uni Eropa (EU Organic)',
      number: 'CU-892182-EU',
      issuer: 'Control Union Certifications',
      validUntil: new Date('2027-05-12T23:59:59Z'),
      verifyUrl: 'https://organic-cert.org/cu892182',
      fileUrl: '/certificates/organic-eu-2027.pdf',
      isDemo: true,
    },
  });

  await prisma.certificate.create({
    data: {
      organizationId: org.id,
      type: CertificateType.ORGANIC_SNI,
      name: 'Sertifikat Pangan Organik Indonesia (SNI 6729:2016)',
      number: 'LS-012-SNI-ORG-882',
      issuer: 'INOFICE (Lembaga Sertifikasi Organik)',
      validUntil: new Date('2028-01-20T23:59:59Z'),
      verifyUrl: 'https://inofice.com/verify/882',
      fileUrl: '/certificates/organic-sni-2028.pdf',
      isDemo: true,
    },
  });

  // Expired demo cert to demonstrate honest badges
  await prisma.certificate.create({
    data: {
      organizationId: org.id,
      type: CertificateType.OTHER,
      name: 'Izin Edar Sementara P-IRT (Tergantikan oleh BPOM MD)',
      number: 'P-IRT 209330201145220',
      issuer: 'Dinas Kesehatan Kabupaten Banyumas',
      validUntil: new Date('2024-11-10T23:59:59Z'),
      isDemo: true,
    },
  });

  // 5. Suppliers (Petani Penderes) with UU PDP Consent
  const supplier1 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Slamet Riyadi (Kelompok Tani Nira Murni)',
      code: 'FARMER-SLM-01',
      publicName: 'Pak Slamet (Kelompok Nira Murni)',
      village: 'Desa Somagede',
      district: 'Kec. Somagede, Kab. Banyumas',
      address: 'RT 02 RW 03, Somagede, Banyumas',
      publicConsent: true,
      consentAt: new Date('2024-01-15T08:00:00Z'),
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Sutrisno (Kelompok Tani Makmur Berkah)',
      code: 'FARMER-STR-02',
      publicName: 'Pak Sutrisno (Kelompok Makmur Berkah)',
      village: 'Desa Kemawi',
      district: 'Kec. Somagede, Kab. Banyumas',
      address: 'RT 01 RW 01, Kemawi, Banyumas',
      publicConsent: true,
      consentAt: new Date('2024-01-15T08:00:00Z'),
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Warsinah (Kelompok Tani Srikandi Nira)',
      code: 'FARMER-WSN-03',
      publicName: 'Ibu Warsinah (Kelompok Srikandi Nira)',
      village: 'Desa Tanggeran',
      district: 'Kec. Somagede, Kab. Banyumas',
      address: 'RT 04 RW 02, Tanggeran, Banyumas',
      publicConsent: true,
      consentAt: new Date('2024-02-01T09:00:00Z'),
    },
  });

  // 6. Master Buyer
  const buyerB2B = await prisma.buyer.create({
    data: {
      organizationId: org.id,
      name: 'PT Megah Rasa Pangan',
      code: 'BUYER-MRP-01',
      contactName: 'Hendrawan Kusuma',
      contactEmail: 'purchasing@megahrasa.co.id',
      contactPhone: '+6281122334455',
      address: 'Kawasan Industri Pulogadung, Jakarta Timur',
    },
  });

  // 7. Receiving Lots from 3 Farmers
  const rcvLot1 = await prisma.lot.create({
    data: {
      organizationId: org.id,
      lotCode: 'RCV-2026-001',
      batchNumber: 'B26-0912-01',
      productName: 'Nira Kelapa Organik Segar',
      quantity: 400.0,
      grossWeight: 420.0,
      tareWeight: 20.0,
      unit: 'kg',
      lotType: LotType.RECEIVED,
      status: LotStatus.RELEASED,
      supplierId: supplier1.id,
      siteId: siteCentral.id,
      locationId: locReceiving.id,
      createdById: operatorUser.id,
      isDemo: true,
      description: 'Penerimaan nira pagi hari, pH 6.8, brix 15%, bebas pengawet sintetis (hanya laru alami).',
    },
  });

  const rcvLot2 = await prisma.lot.create({
    data: {
      organizationId: org.id,
      lotCode: 'RCV-2026-002',
      batchNumber: 'B26-0912-02',
      productName: 'Nira Kelapa Organik Segar',
      quantity: 350.0,
      grossWeight: 365.0,
      tareWeight: 15.0,
      unit: 'kg',
      lotType: LotType.RECEIVED,
      status: LotStatus.RELEASED,
      supplierId: supplier2.id,
      siteId: siteCentral.id,
      locationId: locReceiving.id,
      createdById: operatorUser.id,
      isDemo: true,
      description: 'Penerimaan nira pagi hari, pH 6.7, brix 15.2%.',
    },
  });

  const rcvLot3 = await prisma.lot.create({
    data: {
      organizationId: org.id,
      lotCode: 'RCV-2026-003',
      batchNumber: 'B26-0912-03',
      productName: 'Nira Kelapa Organik Segar',
      quantity: 250.0,
      grossWeight: 260.0,
      tareWeight: 10.0,
      unit: 'kg',
      lotType: LotType.RECEIVED,
      status: LotStatus.RELEASED,
      supplierId: supplier3.id,
      siteId: siteCentral.id,
      locationId: locReceiving.id,
      createdById: operatorUser.id,
      isDemo: true,
      description: 'Penerimaan nira pagi hari, pH 6.9, brix 15.1%.',
    },
  });

  // 8. Processing Event: Evaporasi, Pengkristalan & Pengeringan Oven
  // Input: 400 + 350 + 250 = 1000 kg Nira. Output: 150 kg Gula Semut (rendemen 15%), 848 kg evaporasi air, 2 kg sisa wajan.
  const processedLot = await prisma.lot.create({
    data: {
      organizationId: org.id,
      lotCode: 'LOT-GSO-2026-01',
      batchNumber: 'B26-0912-07', // format B{YY}-{MMDD}-{NN}
      productName: 'Gula Semut Kelapa Organik (Organic Coconut Sugar)',
      quantity: 150.0,
      grossWeight: 155.0,
      tareWeight: 5.0,
      unit: 'kg',
      lotType: LotType.PROCESS_OUTPUT,
      status: LotStatus.RELEASED,
      siteId: siteCentral.id,
      locationId: locOven.id,
      createdById: operatorUser.id,
      releasedById: qaUser.id,
      releasedAt: new Date(),
      bpomType: BpomType.MD,
      bpomNumber: 'MD 252111001234',
      halalCertId: certHalal.id,
      distributorName: 'PT Agriswara Logistik Nusantara',
      isDemo: true,
      description: 'Gula semut organik premium mesh 16-18, kadar air < 2%, aroma karamel alami khas nira kelapa.',
    },
  });

  const processEvent = await prisma.processEvent.create({
    data: {
      organizationId: org.id,
      eventCode: 'PE-2026-0912',
      eventType: ProcessEventType.DRYING,
      customEventName: 'Pemasakan Nira, Kristalisasi & Pengeringan Rotary Oven',
      siteId: siteCentral.id,
      locationId: locOven.id,
      startAt: new Date(Date.now() - 48 * 3600 * 1000),
      endAt: new Date(Date.now() - 40 * 3600 * 1000),
      createdById: operatorUser.id,
      notes: 'Suhu pemasakan bertahap 110°C turun ke 70°C, pengeringan oven pada suhu 60°C selama 4 jam hingga kadar air standar SNI.',
      massBalanceStatus: 'BALANCED',
      massBalanceDiff: 0,
      inputs: {
        create: [
          { lotId: rcvLot1.id, quantity: 400.0, unit: 'kg' },
          { lotId: rcvLot2.id, quantity: 350.0, unit: 'kg' },
          { lotId: rcvLot3.id, quantity: 250.0, unit: 'kg' },
        ],
      },
      outputs: {
        create: [
          {
            lotId: processedLot.id,
            quantity: 150.0,
            unit: 'kg',
            waste: 848.0, // Evaporated moisture
            remaining: 2.0, // Pan residual
          },
        ],
      },
    },
  });

  // Lineage relations
  await prisma.lotRelation.createMany({
    data: [
      { organizationId: org.id, sourceLotId: rcvLot1.id, targetLotId: processedLot.id, relationType: RelationType.MIXED_INTO, quantity: 400, unit: 'kg', eventId: processEvent.id },
      { organizationId: org.id, sourceLotId: rcvLot2.id, targetLotId: processedLot.id, relationType: RelationType.MIXED_INTO, quantity: 350, unit: 'kg', eventId: processEvent.id },
      { organizationId: org.id, sourceLotId: rcvLot3.id, targetLotId: processedLot.id, relationType: RelationType.MIXED_INTO, quantity: 250, unit: 'kg', eventId: processEvent.id },
    ],
  });

  // 9. QA Inspection (SNI 01-3743-1995) & Evidence
  const inspection = await prisma.inspection.create({
    data: {
      organizationId: org.id,
      lotId: processedLot.id,
      sampleId: 'SMP-2026-0912-A',
      testMethod: 'Uji Laboratorium Mutu Gula Semut SNI 01-3743-1995',
      result: 'Kadar Air: 1.82% (Maks 2.0%), Sukrosa: 88.4% (Min 75%), Abu: 1.15% (Maks 2.0%), Logam Berbahaya: Negatif, Mikroba (TPC < 10 CFU/g): Lulus',
      specificationReference: 'SNI 01-3743-1995 Mutu I & Standar Ekspor Organik',
      inspectorId: qaUser.id,
      notes: 'Hasil pengujian memenuhi seluruh parameter rilis untuk sertifikasi pangan organik.',
      status: QualityStatus.APPROVED,
    },
  });

  await prisma.evidence.create({
    data: {
      organizationId: org.id,
      lotId: processedLot.id,
      inspectionId: inspection.id,
      fileName: 'COA-SNI-B26-0912-07.pdf',
      documentUrl: '/evidence/COA-SNI-B26-0912-07.pdf',
      documentType: 'PDF',
      visibility: VisibilityLevel.PUBLIC,
      uploadedById: qaUser.id,
    },
  });

  // 10. Packaging Units (20 retail pouches of 250g)
  const pkg = await prisma.package.create({
    data: {
      organizationId: org.id,
      lotId: processedLot.id,
      packageCode: 'PKG-B26-0912-07-01',
      packageSize: 0.25,
      quantity: 20,
      unit: 'kg',
      status: PackageStatus.ACTIVE,
    },
  });

  // Generate 20 QR Serials: 1st unit has deterministic token for demo, rest have random Crockford
  const qrUnits = [];
  for (let i = 1; i <= 20; i++) {
    const token = i === 1 ? 'DEMOPASSPORT' : generateToken(10);
    const humanSerial = `SGU-B26-0912-07-${String(i).padStart(4, '0')}`;
    qrUnits.push({
      packageId: pkg.id,
      serial: `QR-SIRAGU-2026-${String(i).padStart(4, '0')}`,
      token,
      humanSerial,
      status: QrStatus.ACTIVE,
      scanCount: i === 1 ? 3 : 0,
      firstScanAt: i === 1 ? new Date(Date.now() - 3600 * 1000) : null,
      lastScanAt: i === 1 ? new Date() : null,
      activatedAt: new Date(),
      activatedById: operatorUser.id,
    });
  }
  await prisma.qrSerial.createMany({ data: qrUnits });

  // 11. IoT Devices
  const deviceBox1 = await prisma.iotDevice.create({
    data: {
      organizationId: org.id,
      deviceCode: 'LOGGER-BOX-01',
      tokenHash: 'devtoken_logger_box_01',
      battery: 98,
      lastSeenAt: new Date(),
      isDemo: true,
    },
  });

  const deviceBox2 = await prisma.iotDevice.create({
    data: {
      organizationId: org.id,
      deviceCode: 'LOGGER-BOX-02',
      tokenHash: 'devtoken_logger_box_02',
      battery: 92,
      lastSeenAt: new Date(),
      isDemo: true,
    },
  });

  // 12. Shipment with 2 Boxes (Purwokerto -> Jakarta)
  const shipment = await prisma.shipment.create({
    data: {
      organizationId: org.id,
      shipmentCode: 'SHP26-0001',
      buyerId: buyerB2B.id,
      distributorName: 'PT Agriswara Logistik Nusantara',
      shipmentDate: new Date(Date.now() - 16 * 3600 * 1000),
      status: ShipmentStatus.SHIPPED,
      createdById: operatorUser.id,
      lines: {
        create: [
          {
            lotId: processedLot.id,
            quantity: 5.0,
            unit: 'kg',
            packageCount: 20,
          },
        ],
      },
      legs: {
        create: [
          {
            seq: 1,
            fromName: 'Gudang Pabrik Somagede, Banyumas',
            toName: 'Hub Logistik Distribusi Purwokerto',
            departAt: new Date(Date.now() - 16 * 3600 * 1000),
            arriveAt: new Date(Date.now() - 14 * 3600 * 1000),
          },
          {
            seq: 2,
            fromName: 'Hub Logistik Distribusi Purwokerto',
            toName: 'Pusat Distribusi Retail Jakarta Timur',
            departAt: new Date(Date.now() - 13 * 3600 * 1000),
            arriveAt: new Date(Date.now() - 2 * 3600 * 1000),
          },
        ],
      },
      shareLinks: {
        create: [
          {
            organizationId: org.id,
            buyerId: buyerB2B.id,
            token: 'DOSSIER2026GOLDEN',
            expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          },
        ],
      },
    },
  });

  // Box 1: Normal Temperature (22-25°C) -> Status OK
  const box1 = await prisma.box.create({
    data: {
      organizationId: org.id,
      shipmentId: shipment.id,
      boxCode: 'BOX-SHP26-0001-01',
      token: 'BOXDEMO0001',
      deviceId: deviceBox1.id,
      loggerStartAt: new Date(Date.now() - 16 * 3600 * 1000),
    },
  });

  // Assign the first 10 QR serials to Box 1
  const allSerials = await prisma.qrSerial.findMany({ where: { packageId: pkg.id } });
  const serialIdsBox1 = allSerials.slice(0, 10).map((s) => s.id);
  const serialIdsBox2 = allSerials.slice(10, 20).map((s) => s.id);

  await prisma.qrSerial.updateMany({
    where: { id: { in: serialIdsBox1 } },
    data: { boxId: box1.id },
  });

  // Simulate 200 readings for Box 1 (Normal scenario)
  const readingsBox1 = simulateReadings({
    scenario: 'normal',
    start: new Date(Date.now() - 16 * 3600 * 1000),
    points: 192, // Every 5 minutes for 16 hours
    intervalMinutes: 5,
    seed: 101,
  });

  await prisma.tempReading.createMany({
    data: readingsBox1.map((r) => ({
      deviceId: deviceBox1.id,
      boxId: box1.id,
      ts: r.ts,
      tempC: r.tempC,
      rhPct: r.rhPct,
      battery: 98,
    })),
  });

  const summary1 = summarize(readingsBox1, DEFAULT_SPEC);
  await prisma.tempSummary.create({
    data: {
      boxId: box1.id,
      status: TempStatus.OK,
      count: summary1.count,
      minC: summary1.minC,
      avgC: summary1.avgC,
      maxC: summary1.maxC,
      warningCount: summary1.warningCount,
      deviationCount: summary1.deviationCount,
      deviationMinutes: summary1.deviationMinutes,
      belowRangeCount: summary1.belowRangeCount,
      maxRhPct: summary1.maxRhPct,
      rhExceedCount: summary1.rhExceedCount,
      firstTs: summary1.firstTs,
      lastTs: summary1.lastTs,
    },
  });

  // Box 2: Controlled Scenario with brief warning spike (for demo comparison)
  const box2 = await prisma.box.create({
    data: {
      organizationId: org.id,
      shipmentId: shipment.id,
      boxCode: 'BOX-SHP26-0001-02',
      token: 'BOXDEMO0002',
      deviceId: deviceBox2.id,
      loggerStartAt: new Date(Date.now() - 16 * 3600 * 1000),
    },
  });

  await prisma.qrSerial.updateMany({
    where: { id: { in: serialIdsBox2 } },
    data: { boxId: box2.id },
  });

  const readingsBox2 = simulateReadings({
    scenario: 'warning',
    start: new Date(Date.now() - 16 * 3600 * 1000),
    points: 192,
    intervalMinutes: 5,
    seed: 202,
  });

  await prisma.tempReading.createMany({
    data: readingsBox2.map((r) => ({
      deviceId: deviceBox2.id,
      boxId: box2.id,
      ts: r.ts,
      tempC: r.tempC,
      rhPct: r.rhPct,
      battery: 92,
    })),
  });

  const summary2 = summarize(readingsBox2, DEFAULT_SPEC);
  await prisma.tempSummary.create({
    data: {
      boxId: box2.id,
      status: TempStatus.WARNING,
      count: summary2.count,
      minC: summary2.minC,
      avgC: summary2.avgC,
      maxC: summary2.maxC,
      warningCount: summary2.warningCount,
      deviationCount: summary2.deviationCount,
      deviationMinutes: summary2.deviationMinutes,
      belowRangeCount: summary2.belowRangeCount,
      maxRhPct: summary2.maxRhPct,
      rhExceedCount: summary2.rhExceedCount,
      firstTs: summary2.firstTs,
      lastTs: summary2.lastTs,
    },
  });

  console.log('✅ Golden Path Seed created successfully!');
  console.log(`   - Organization: ${org.name} (ID: ${org.id})`);
  console.log('   - Logins: owner@siragu.id / qa@siragu.id / operator@siragu.id (Password: Siragu2026!)');
  console.log('   - Legacy Demo Login: owner@siragu.demo / operator@siragu.demo (Password: demo1234)');
  console.log(`   - Public Consumer QR Token: DEMOPASSPORT`);
  console.log(`   - B2B Shipment Box 1 Token: BOXDEMO0001`);
  console.log(`   - B2B Dossier Share Token: DOSSIER2026GOLDEN`);
}

export { main as runSeed };

// Only run immediately if executed directly
if (process.argv[1]?.endsWith('seed.ts')) {
  main()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
