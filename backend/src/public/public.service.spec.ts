import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PublicService } from './public.service.js';
import { PdfService } from './pdf.service.js';

describe('PublicService & PdfService', () => {
  let publicService: PublicService;
  let pdfService: PdfService;
  let mockPrisma: any;

  beforeEach(() => {
    pdfService = new PdfService();
    mockPrisma = {
      qrSerial: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      lot: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      scanEvent: {
        create: vi.fn(),
      },
      certificate: {
        findMany: vi.fn().mockResolvedValue([
          {
            name: 'EU Organic Standar',
            type: 'ORGANIC_EU',
            number: 'CU-892182-EU',
            validUntil: new Date('2028-01-01'),
            issuer: 'Control Union',
          },
        ]),
      },
      box: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      pdfSnapshot: {
        upsert: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    publicService = new PublicService(mockPrisma, pdfService);
  });

  it('retrieves lot passport and respects UU PDP privacy rules', async () => {
    mockPrisma.qrSerial.findFirst.mockResolvedValue({
      id: 'qr-1',
      token: 'DEMOPASSPORT',
      humanSerial: 'SGU-B26-0912-07-0001',
      scanCount: 2,
      anomalyStatus: 'NORMAL',
      package: {
        packageSize: 0.25,
        unit: 'kg',
        lot: {
          id: 'lot-1',
          organizationId: 'org-1',
          batchNumber: 'B26-0912-07',
          status: 'RELEASED',
          createdAt: new Date('2026-09-12'),
          bpomType: 'MD',
          bpomNumber: 'MD 252111001234',
          processOutputs: [
            {
              event: {
                inputs: [
                  {
                    lot: {
                      supplier: {
                        name: 'Slamet Riyadi',
                        publicName: 'Pak Slamet',
                        village: 'Somagede',
                        district: 'Banyumas',
                        publicConsent: true,
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    const res = await publicService.getLotPassport('DEMOPASSPORT', '127.0.0.1');

    expect(res.token).toBe('DEMOPASSPORT');
    expect(res.lot.batchNumber).toBe('B26-0912-07');
    expect(res.farmers[0].name).toBe('Pak Slamet');
    expect(res.certificates.length).toBeGreaterThan(0);
    expect(res.certificates[0].status).toBe('ACTIVE');
  });

  it('anonymizes farmer name when UU PDP publicConsent is false', async () => {
    mockPrisma.qrSerial.findFirst.mockResolvedValue({
      id: 'qr-2',
      token: 'TOKENPRIVACY',
      humanSerial: 'SGU-B26-0912-07-0002',
      scanCount: 0,
      anomalyStatus: 'NORMAL',
      package: {
        packageSize: 0.25,
        unit: 'kg',
        lot: {
          id: 'lot-2',
          organizationId: 'org-1',
          batchNumber: 'B26-0912-07',
          status: 'RELEASED',
          createdAt: new Date('2026-09-12'),
          processOutputs: [
            {
              event: {
                inputs: [
                  {
                    lot: {
                      supplier: {
                        name: 'Private Farmer Name',
                        village: 'Secret Village',
                        publicConsent: false,
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    const res = await publicService.getLotPassport('TOKENPRIVACY', '127.0.0.1');

    expect(res.farmers[0].name).toBe('Mitra Petani Organik Siragu');
    expect(res.farmers[0].village).toBe('Kawasan Lestari Penderes');
  });

  it('generates a tamper-evident PDF with QR code and SHA-256 digest', async () => {
    const { pdfBytes, sha256 } = await pdfService.generateLotPassportPdf({
      token: 'DEMOPASSPORT',
      humanSerial: 'SGU-B26-0912-07-0001',
      batchNumber: 'B26-0912-07',
      variety: 'ORGANIC_COCONUT_SUGAR',
      grade: 'SUPER_A_PREMIUM',
      harvestDate: '2026-09-12',
      packagedAt: '2026-09-14',
      bestBefore: '2028-09-14',
      verifyUrl: 'https://trace.siragu.id/v/DEMOPASSPORT',
      qa: {
        moisture: 1.82,
        mesh16Pass: 98.5,
        waterInsoluble: 0.12,
        organoleptic: 'Aroma karamel alami, rasa manis legit',
        sniCompliant: true,
        testedAt: '2026-09-13',
      },
      farmers: [{ name: 'Pak Slamet', village: 'Somagede', certified: true }],
      certificates: [{ name: 'EU Organic', number: 'CU-892182', issuer: 'CU', status: 'ACTIVE' }],
      bpom: { canonical: 'BPOM RI MD 252111001234', number: '252111001234' },
      halal: { number: '33110001892830224' },
    });

    expect(pdfBytes.length).toBeGreaterThan(1000);
    expect(sha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
