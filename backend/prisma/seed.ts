import { PrismaClient, LotType, RelationType, ProcessEventType, LotStatus, QualityStatus, Role, PackageStatus, QrStatus, SensorState, ComplaintStatus, ShipmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 8 Data...');

  // 1. Clean up existing data to prevent conflicts
  await prisma.qrSerial.deleteMany();
  await prisma.package.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.shipmentLine.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.lotRelation.deleteMany();
  await prisma.processEventInput.deleteMany();
  await prisma.processEventOutput.deleteMany();
  await prisma.processEvent.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.gateway.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.location.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 2. Foundation: Org, Site, Location, Users
  const org = await prisma.organization.create({ data: { name: 'SIRAGU Trace Demo Org' } });
  
  const site = await prisma.site.create({ data: { organizationId: org.id, name: 'Main HQ' } });
  
  const locWarehouse = await prisma.location.create({ data: { siteId: site.id, name: 'Warehouse A', type: 'WAREHOUSE' } });
  const locProcess = await prisma.location.create({ data: { siteId: site.id, name: 'Processing Floor', type: 'PROCESSING' } });

  const ownerHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'owner@siragu.demo',
      name: 'Owner Admin',
      role: Role.OWNER,
      passwordHash: ownerHash
    }
  });

  // 3. Master Data: 3 Suppliers, 2 Buyers
  const supA = await prisma.supplier.create({ data: { organizationId: org.id, name: 'Supplier A Farm', code: 'SUP-A' } });
  const supB = await prisma.supplier.create({ data: { organizationId: org.id, name: 'Supplier B Co-op', code: 'SUP-B' } });
  const supC = await prisma.supplier.create({ data: { organizationId: org.id, name: 'Supplier C Estate', code: 'SUP-C' } });

  const buyerA = await prisma.buyer.create({ data: { organizationId: org.id, name: 'Global Distro A', code: 'BUY-A' } });
  const buyerB = await prisma.buyer.create({ data: { organizationId: org.id, name: 'Local Market B', code: 'BUY-B' } });

  // 4. Traceability Hierarchy (Many-to-Many Lineage)
  // 5 Input Lots (Received)
  const inLots = await Promise.all([
    prisma.lot.create({ data: { organizationId: org.id, lotCode: 'RCV-001', lotType: LotType.RECEIVED, productName: 'Raw Cacao', quantity: 1000, unit: 'kg', supplierId: supA.id, status: LotStatus.RELEASED, siteId: site.id } }),
    prisma.lot.create({ data: { organizationId: org.id, lotCode: 'RCV-002', lotType: LotType.RECEIVED, productName: 'Raw Cacao', quantity: 1000, unit: 'kg', supplierId: supB.id, status: LotStatus.RELEASED, siteId: site.id } }),
    prisma.lot.create({ data: { organizationId: org.id, lotCode: 'RCV-003', lotType: LotType.RECEIVED, productName: 'Raw Cacao', quantity: 1000, unit: 'kg', supplierId: supC.id, status: LotStatus.RELEASED, siteId: site.id } }),
    prisma.lot.create({ data: { organizationId: org.id, lotCode: 'RCV-004', lotType: LotType.RECEIVED, productName: 'Vanilla Extract', quantity: 100, unit: 'kg', supplierId: supA.id, status: LotStatus.RELEASED, siteId: site.id } }),
    prisma.lot.create({ data: { organizationId: org.id, lotCode: 'RCV-005', lotType: LotType.RECEIVED, productName: 'Sugar', quantity: 500, unit: 'kg', supplierId: supB.id, status: LotStatus.RELEASED, siteId: site.id } })
  ]);

  // 2 Mix Events
  // Mix 1: RCV-001 + RCV-002 + RCV-003 -> MIX-001 (Blended Cacao)
  const mixLot1 = await prisma.lot.create({ data: { organizationId: org.id, lotCode: 'MIX-001', lotType: LotType.MIX_OUTPUT, productName: 'Blended Cacao', quantity: 3000, unit: 'kg', status: LotStatus.READY, siteId: site.id, locationId: locProcess.id } });
  const mixEvent1 = await prisma.processEvent.create({ data: { organizationId: org.id, eventCode: 'PE-MIX-01', eventType: ProcessEventType.MIXING, startAt: new Date(), createdById: user.id, siteId: site.id, locationId: locProcess.id } });
  
  await prisma.processEventInput.createMany({ data: [ { eventId: mixEvent1.id, lotId: inLots[0].id, quantity: 1000, unit: 'kg' }, { eventId: mixEvent1.id, lotId: inLots[1].id, quantity: 1000, unit: 'kg' }, { eventId: mixEvent1.id, lotId: inLots[2].id, quantity: 1000, unit: 'kg' } ] });
  await prisma.processEventOutput.create({ data: { eventId: mixEvent1.id, lotId: mixLot1.id, quantity: 3000, unit: 'kg' } });
  await prisma.lotRelation.createMany({ data: [
    { organizationId: org.id, sourceLotId: inLots[0].id, targetLotId: mixLot1.id, relationType: RelationType.MIXED_INTO, quantity: 1000, unit: 'kg', eventId: mixEvent1.id },
    { organizationId: org.id, sourceLotId: inLots[1].id, targetLotId: mixLot1.id, relationType: RelationType.MIXED_INTO, quantity: 1000, unit: 'kg', eventId: mixEvent1.id },
    { organizationId: org.id, sourceLotId: inLots[2].id, targetLotId: mixLot1.id, relationType: RelationType.MIXED_INTO, quantity: 1000, unit: 'kg', eventId: mixEvent1.id }
  ]});

  // Mix 2: MIX-001 + RCV-004 + RCV-005 -> MIX-002 (Flavored Chocolate)
  const mixLot2 = await prisma.lot.create({ data: { organizationId: org.id, lotCode: 'MIX-002', lotType: LotType.MIX_OUTPUT, productName: 'Flavored Chocolate', quantity: 3600, unit: 'kg', status: LotStatus.RELEASED, siteId: site.id, locationId: locProcess.id } });
  const mixEvent2 = await prisma.processEvent.create({ data: { organizationId: org.id, eventCode: 'PE-MIX-02', eventType: ProcessEventType.MIXING, startAt: new Date(), createdById: user.id } });
  await prisma.lotRelation.createMany({ data: [
    { organizationId: org.id, sourceLotId: mixLot1.id, targetLotId: mixLot2.id, relationType: RelationType.MIXED_INTO, quantity: 3000, unit: 'kg', eventId: mixEvent2.id },
    { organizationId: org.id, sourceLotId: inLots[3].id, targetLotId: mixLot2.id, relationType: RelationType.MIXED_INTO, quantity: 100, unit: 'kg', eventId: mixEvent2.id },
    { organizationId: org.id, sourceLotId: inLots[4].id, targetLotId: mixLot2.id, relationType: RelationType.MIXED_INTO, quantity: 500, unit: 'kg', eventId: mixEvent2.id }
  ]});

  // 1 Split/Process Event: MIX-002 -> OUT-001, OUT-002, OUT-003, OUT-004
  const outLots = await Promise.all(
    ['OUT-001','OUT-002','OUT-003','OUT-004'].map(c => 
      prisma.lot.create({ data: { organizationId: org.id, lotCode: c, lotType: LotType.PROCESS_OUTPUT, productName: 'Chocolate Bar Batch', quantity: 900, unit: 'kg', status: LotStatus.RELEASED } })
    )
  );
  
  const processEvent = await prisma.processEvent.create({ data: { organizationId: org.id, eventCode: 'PE-PROC-01', eventType: ProcessEventType.CUSTOM, startAt: new Date(), createdById: user.id } });
  for (const outLot of outLots) {
    await prisma.lotRelation.create({ data: { organizationId: org.id, sourceLotId: mixLot2.id, targetLotId: outLot.id, relationType: RelationType.TRANSFORMED_TO, quantity: 900, unit: 'kg', eventId: processEvent.id } });
  }

  // 5. Inspections
  const inspections = await Promise.all([
    prisma.inspection.create({ data: { organizationId: org.id, lotId: inLots[0].id, testMethod: 'Visual', result: 'Pass', status: QualityStatus.APPROVED } }),
    prisma.inspection.create({ data: { organizationId: org.id, lotId: inLots[1].id, testMethod: 'Visual', result: 'Pass', status: QualityStatus.APPROVED } }),
    prisma.inspection.create({ data: { organizationId: org.id, lotId: inLots[2].id, testMethod: 'Visual', result: 'Pass', status: QualityStatus.APPROVED } }),
    prisma.inspection.create({ data: { organizationId: org.id, lotId: mixLot1.id, testMethod: 'Moisture', result: '12%', status: QualityStatus.APPROVED } }),
    prisma.inspection.create({ data: { organizationId: org.id, lotId: outLots[0].id, testMethod: 'Metal Detector', result: 'Clear', status: QualityStatus.APPROVED } }),
  ]);

  // 6. Packaging & QR
  const pkg1 = await prisma.package.create({ data: { organizationId: org.id, lotId: outLots[0].id, packageCode: 'PKG-001', quantity: 5, unit: 'box', packageSize: 10, status: PackageStatus.ACTIVE } });
  const pkg2 = await prisma.package.create({ data: { organizationId: org.id, lotId: outLots[1].id, packageCode: 'PKG-002', quantity: 5, unit: 'box', packageSize: 10, status: PackageStatus.ACTIVE } });
  
  const qrs = [];
  for(let i=0; i<10; i++) {
    qrs.push({ packageId: i < 5 ? pkg1.id : pkg2.id, serial: `QR-DEMO-${1000+i}`, status: QrStatus.ACTIVE, activatedAt: new Date(), activatedById: user.id });
  }
  await prisma.qrSerial.createMany({ data: qrs });

  // 7. Shipments
  await prisma.shipment.create({
    data: { organizationId: org.id, shipmentCode: 'SHP-100', buyerId: buyerA.id, shipmentDate: new Date(), status: ShipmentStatus.SHIPPED,
      lines: { create: [{ lotId: outLots[0].id, quantity: 900, unit: 'kg' }] }
    }
  });
  await prisma.shipment.create({
    data: { organizationId: org.id, shipmentCode: 'SHP-101', buyerId: buyerB.id, shipmentDate: new Date(), status: ShipmentStatus.SHIPPED,
      lines: { create: [{ lotId: outLots[1].id, quantity: 900, unit: 'kg' }] }
    }
  });

  // 8. Complaints
  await prisma.complaint.create({
    data: {
      organizationId: org.id, caseCode: 'CC-001928', reportedBy: 'Consumer X', reason: 'Foreign Object', description: 'Found plastic in package',
      relatedPackageId: pkg1.id, status: ComplaintStatus.ACTION_REQUIRED,
      impactScope: {
        backwardTraceLots: [mixLot2.id, mixLot1.id, inLots[0].id, inLots[1].id, inLots[2].id, inLots[3].id, inLots[4].id],
        forwardTraceLots: [outLots[0].id, outLots[1].id, outLots[2].id, outLots[3].id],
        affectedBuyers: ['Global Distro A', 'Local Market B']
      }
    }
  });

  // 9. IoT
  const gw = await prisma.gateway.create({ data: { organizationId: org.id, siteId: site.id, deviceCode: 'GW-01' } });
  await prisma.sensor.create({ data: { organizationId: org.id, deviceCode: 'ENV-WH-001', locationId: locWarehouse.id, gatewayId: gw.id, status: SensorState.ONLINE } });
  await prisma.sensor.create({ data: { organizationId: org.id, deviceCode: 'ENV-PR-002', locationId: locProcess.id, gatewayId: gw.id, status: SensorState.MISSING_DATA } });

  console.log('Seed completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
