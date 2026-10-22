export interface PublicLotPassportDto {
  token: string;
  humanSerial: string;
  scanCount: number;
  anomalyStatus: string;
  isFlagged: boolean;
  lot: {
    id: string;
    batchNumber: string;
    variety: string;
    grade: string;
    status: string;
    harvestDate: string;
    packagedAt: string;
    bestBefore: string;
    packageSizeKg: number;
    unit: string;
  };
  qa: {
    moisturePct: number;
    mesh16PassPct: number;
    waterInsolublePct: number;
    organoleptic: string;
    sniCompliant: boolean;
    testedAt: string;
    inspectorName?: string;
  };
  farmers: Array<{
    name: string;
    village: string;
    subdistrict: string;
    certified: boolean;
    treeCount?: number;
  }>;
  processing: {
    facility: string;
    method: string;
    processedAt: string;
  };
  certificates: Array<{
    name: string;
    type: string;
    number: string;
    issuer: string;
    status: string;
    validUntil: string;
    verifyUrl?: string;
  }>;
  bpom: {
    canonical: string;
    number: string;
    verifyUrl: string;
  };
  halal: {
    number: string;
    verifyUrl: string;
  };
  temperature?: {
    status: string;
    minC: number;
    maxC: number;
    avgC: number;
    deviationMinutes: number;
    maxRhPct?: number;
    recentReadings: Array<{
      ts: string;
      tempC: number;
      rhPct?: number;
      status: string;
    }>;
  };
  pdfDownloadUrl: string;
}

export interface PublicShipmentPassportDto {
  token: string;
  shipmentNumber: string;
  boxCode: string;
  buyerName: string;
  destinationPort: string;
  dispatchedAt: string;
  deliveredAt?: string;
  status: string;
  legs: Array<{
    seq: number;
    from: string;
    to: string;
    departAt?: string;
    arriveAt?: string;
  }>;
  temperature: {
    status: string;
    minC: number;
    maxC: number;
    avgC: number;
    count: number;
    deviationMinutes: number;
    maxRhPct?: number;
    readings: Array<{
      ts: string;
      tempC: number;
      rhPct?: number;
      status: string;
    }>;
  };
  lots: Array<{
    batchNumber: string;
    variety: string;
    grade: string;
    packageCount: number;
    totalWeightKg: number;
  }>;
  certificates: Array<{
    name: string;
    number: string;
    issuer: string;
    status: string;
  }>;
  pdfDownloadUrl: string;
}

export interface PublicDossierDto {
  token: string;
  shipment: PublicShipmentPassportDto;
  lots: PublicLotPassportDto[];
  expiresAt: string;
}
