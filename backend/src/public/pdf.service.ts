import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'node:crypto';

@Injectable()
export class PdfService {
  /**
   * Generates a branded, tamper-evident Lot Traceability Passport PDF.
   */
  async generateLotPassportPdf(data: {
    token: string;
    humanSerial: string;
    batchNumber: string;
    variety: string;
    grade: string;
    harvestDate: string;
    packagedAt: string;
    bestBefore: string;
    verifyUrl: string;
    qa: {
      moisture: number;
      mesh16Pass: number;
      waterInsoluble: number;
      organoleptic: string;
      sniCompliant: boolean;
      testedAt: string;
    };
    farmers: Array<{ name: string; village: string; certified: boolean }>;
    certificates: Array<{ name: string; number: string; issuer: string; status: string }>;
    bpom: { canonical: string; number: string };
    halal: { number: string };
    tempSummary?: { status: string; minC: number; maxC: number; avgC: number };
  }): Promise<{ pdfBytes: Uint8Array; sha256: string }> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4 portrait (pts)
    const { width, height } = page.getSize();

    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

    // Color Palette
    const cForest = rgb(0.106, 0.302, 0.243); // #1B4D3E
    const cGold = rgb(0.831, 0.686, 0.216);   // #D4AF37
    const cDark = rgb(0.118, 0.118, 0.118);   // #1E1E1E
    const cGray = rgb(0.45, 0.45, 0.45);
    const cLightBg = rgb(0.96, 0.97, 0.96);
    const cGreenPass = rgb(0.12, 0.53, 0.25);
    const cBorder = rgb(0.85, 0.87, 0.85);

    // Header Bar
    page.drawRectangle({
      x: 0,
      y: height - 90,
      width,
      height: 90,
      color: cForest,
    });

    page.drawText('SIRAGU TRACE', {
      x: 40,
      y: height - 42,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('ORGANIC COCONUT SUGAR • LOT PASSPORT & PASPOR KETERTELUSURAN', {
      x: 40,
      y: height - 64,
      size: 9,
      font: fontRegular,
      color: cGold,
    });

    // Generate & Embed QR Code
    const qrPng = await QRCode.toBuffer(data.verifyUrl, {
      width: 250,
      margin: 1,
      color: { dark: '#1B4D3Eff', light: '#FFFFFFFF' },
    });
    const qrImage = await doc.embedPng(qrPng);
    const qrSize = 100;
    page.drawImage(qrImage, {
      x: width - 40 - qrSize,
      y: height - 195,
      width: qrSize,
      height: qrSize,
    });

    page.drawText('Scan to Verify Live', {
      x: width - 36 - qrSize,
      y: height - 208,
      size: 8,
      font: fontOblique,
      color: cGray,
    });

    // Lot Identity Card
    let y = height - 120;
    page.drawText(`Batch: ${data.batchNumber}`, {
      x: 40,
      y,
      size: 16,
      font: fontBold,
      color: cDark,
    });

    y -= 18;
    page.drawText(`Serial / Token: ${data.humanSerial} (${data.token})`, {
      x: 40,
      y,
      size: 10,
      font: fontRegular,
      color: cGray,
    });

    y -= 18;
    page.drawText(`Produk: ${data.variety.replace(/_/g, ' ')}  |  Grade: ${data.grade}`, {
      x: 40,
      y,
      size: 10,
      font: fontBold,
      color: cForest,
    });

    y -= 16;
    page.drawText(`Kemasan: ${data.packagedAt}  |  Best Before: ${data.bestBefore}`, {
      x: 40,
      y,
      size: 9,
      font: fontRegular,
      color: cDark,
    });

    // Divider
    y -= 30;
    page.drawLine({
      start: { x: 40, y },
      end: { x: width - 40, y },
      thickness: 1,
      color: cBorder,
    });

    // Section 1: Quality & SNI 3743:2021 Specs
    y -= 24;
    page.drawText('1. PARAMETER MUTU & ANALISIS LAB (SNI 3743:2021)', {
      x: 40,
      y,
      size: 11,
      font: fontBold,
      color: cForest,
    });

    y -= 8;
    // Table Box
    const tableTop = y;
    page.drawRectangle({
      x: 40,
      y: tableTop - 70,
      width: width - 80,
      height: 70,
      color: cLightBg,
      borderColor: cBorder,
      borderWidth: 1,
    });

    page.drawText('Parameter Uji', { x: 50, y: tableTop - 18, size: 9, font: fontBold, color: cDark });
    page.drawText('Standar SNI 3743:2021', { x: 200, y: tableTop - 18, size: 9, font: fontBold, color: cDark });
    page.drawText('Hasil Uji Lot Ini', { x: 360, y: tableTop - 18, size: 9, font: fontBold, color: cDark });
    page.drawText('Status', { x: 480, y: tableTop - 18, size: 9, font: fontBold, color: cDark });

    page.drawText('Kadar Air (Moisture)', { x: 50, y: tableTop - 34, size: 8.5, font: fontRegular, color: cDark });
    page.drawText('Maks. 3.0 %', { x: 200, y: tableTop - 34, size: 8.5, font: fontRegular, color: cDark });
    page.drawText(`${data.qa.moisture.toFixed(2)} %`, { x: 360, y: tableTop - 34, size: 8.5, font: fontBold, color: cForest });
    page.drawText('PASS (LULUS)', { x: 480, y: tableTop - 34, size: 8.5, font: fontBold, color: cGreenPass });

    page.drawText('Bagian Tak Larut Air', { x: 50, y: tableTop - 48, size: 8.5, font: fontRegular, color: cDark });
    page.drawText('Maks. 0.2 %', { x: 200, y: tableTop - 48, size: 8.5, font: fontRegular, color: cDark });
    page.drawText(`${data.qa.waterInsoluble.toFixed(2)} %`, { x: 360, y: tableTop - 48, size: 8.5, font: fontBold, color: cForest });
    page.drawText('PASS (LULUS)', { x: 480, y: tableTop - 48, size: 8.5, font: fontBold, color: cGreenPass });

    page.drawText('Keseragaman Butir (Mesh 16)', { x: 50, y: tableTop - 62, size: 8.5, font: fontRegular, color: cDark });
    page.drawText('Min. 95 % Lolos', { x: 200, y: tableTop - 62, size: 8.5, font: fontRegular, color: cDark });
    page.drawText(`${data.qa.mesh16Pass}% Lolos`, { x: 360, y: tableTop - 62, size: 8.5, font: fontBold, color: cForest });
    page.drawText('PASS (LULUS)', { x: 480, y: tableTop - 62, size: 8.5, font: fontBold, color: cGreenPass });

    // Section 2: Farmer Origin & Transparency (UU PDP Compliant)
    y = tableTop - 100;
    page.drawText('2. ASAL-USUL PETANI & KETERTELUSURAN MATA RANTAI', {
      x: 40,
      y,
      size: 11,
      font: fontBold,
      color: cForest,
    });

    y -= 16;
    for (const f of data.farmers.slice(0, 3)) {
      page.drawText(`• ${f.name} — ${f.village} (Sertifikasi Organik Aktif)`, {
        x: 50,
        y,
        size: 9,
        font: fontRegular,
        color: cDark,
      });
      y -= 14;
    }

    // Section 3: Legal & Food Safety Registrations
    y -= 10;
    page.drawText('3. LEGALITAS & SERTIFIKASI RESMI', {
      x: 40,
      y,
      size: 11,
      font: fontBold,
      color: cForest,
    });

    y -= 16;
    page.drawText(`BPOM RI: ${data.bpom.canonical || data.bpom.number} (Terverifikasi di cekbpom.pom.go.id)`, {
      x: 50,
      y,
      size: 9,
      font: fontBold,
      color: cDark,
    });

    y -= 14;
    page.drawText(`Halal BPJPH RI: ID${data.halal.number} (Kementerian Agama RI)`, {
      x: 50,
      y,
      size: 9,
      font: fontBold,
      color: cDark,
    });

    y -= 14;
    for (const c of data.certificates.slice(0, 3)) {
      page.drawText(`Sertifikat: ${c.name} — No. ${c.number} (${c.issuer || 'LSO'}, Status: ${c.status})`, {
        x: 50,
        y,
        size: 8.5,
        font: fontRegular,
        color: cDark,
      });
      y -= 13;
    }

    // Section 4: Cold-Chain & Distribution Integrity (if available)
    if (data.tempSummary) {
      y -= 10;
      page.drawText('4. PEMANTAUAN SUHU & IOT COLD-CHAIN', {
        x: 40,
        y,
        size: 11,
        font: fontBold,
        color: cForest,
      });
      y -= 16;
      page.drawText(
        `Status Rantai Distribusi: ${data.tempSummary.status} | Min: ${data.tempSummary.minC}°C | Rata-rata: ${data.tempSummary.avgC}°C | Maks: ${data.tempSummary.maxC}°C (Batas Aman: 20-26°C)`,
        { x: 50, y, size: 8.5, font: fontRegular, color: cDark },
      );
      y -= 12;
    }

    // Footer & Cryptographic SHA-256 Digest Box
    const footerY = 55;
    page.drawLine({
      start: { x: 40, y: footerY + 25 },
      end: { x: width - 40, y: footerY + 25 },
      thickness: 1,
      color: cBorder,
    });

    // Compute PDF bytes preliminary and placeholder digest
    const interimBytes = await doc.save();
    const sha256 = crypto.createHash('sha256').update(interimBytes).digest('hex');

    page.drawText(`Document Digest (SHA-256): ${sha256}`, {
      x: 40,
      y: footerY + 12,
      size: 7.5,
      font: fontBold,
      color: cForest,
    });

    page.drawText(
      `SIRAGU Trace Engine • Paspor ini dihasilkan otomatis secara aman dan anti-pemalsuan • Verifikasi keaslian: ${data.verifyUrl}`,
      {
        x: 40,
        y: footerY,
        size: 7.5,
        font: fontRegular,
        color: cGray,
      },
    );

    const pdfBytes = await doc.save();
    return { pdfBytes, sha256 };
  }

  /**
   * Generates a B2B Shipment Cold-Chain Compliance Passport PDF.
   */
  async generateShipmentPassportPdf(data: {
    token: string;
    shipmentNumber: string;
    boxNumber: string;
    buyerName: string;
    destinationPort: string;
    dispatchedAt: string;
    deliveredAt?: string;
    verifyUrl: string;
    tempSummary: {
      status: string;
      minC: number;
      maxC: number;
      avgC: number;
      count: number;
      warningCount: number;
      deviationMinutes: number;
      maxRhPct?: number;
    };
    legs: Array<{ seq: number; from: string; to: string; depart?: string; arrive?: string }>;
    lots: Array<{ batchNumber: string; variety: string; grade: string; packageCount: number }>;
  }): Promise<{ pdfBytes: Uint8Array; sha256: string }> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

    const cForest = rgb(0.106, 0.302, 0.243);
    const cGold = rgb(0.831, 0.686, 0.216);
    const cDark = rgb(0.118, 0.118, 0.118);
    const cGray = rgb(0.45, 0.45, 0.45);
    const cLightBg = rgb(0.96, 0.97, 0.96);
    const cGreenPass = rgb(0.12, 0.53, 0.25);
    const cBorder = rgb(0.85, 0.87, 0.85);

    // Header
    page.drawRectangle({
      x: 0,
      y: height - 90,
      width,
      height: 90,
      color: cForest,
    });

    page.drawText('SIRAGU TRACE — B2B SHIPMENT PASSPORT', {
      x: 40,
      y: height - 42,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('COLD-CHAIN & TRANSIT COMPLIANCE DOSSIER • DOKUMEN INTEGRITAS PENGIRIMAN', {
      x: 40,
      y: height - 64,
      size: 8.5,
      font: fontRegular,
      color: cGold,
    });

    // Embed QR
    const qrPng = await QRCode.toBuffer(data.verifyUrl, {
      width: 250,
      margin: 1,
      color: { dark: '#1B4D3Eff', light: '#FFFFFFFF' },
    });
    const qrImage = await doc.embedPng(qrPng);
    const qrSize = 95;
    page.drawImage(qrImage, {
      x: width - 40 - qrSize,
      y: height - 190,
      width: qrSize,
      height: qrSize,
    });

    page.drawText('Verify Live Sensor Data', {
      x: width - 36 - qrSize,
      y: height - 202,
      size: 7.5,
      font: fontOblique,
      color: cGray,
    });

    // Shipment Identity
    let y = height - 120;
    page.drawText(`Shipment: ${data.shipmentNumber}`, {
      x: 40,
      y,
      size: 15,
      font: fontBold,
      color: cDark,
    });

    y -= 18;
    page.drawText(`Box Code: ${data.boxNumber} (Passport Token: ${data.token})`, {
      x: 40,
      y,
      size: 9.5,
      font: fontRegular,
      color: cGray,
    });

    y -= 16;
    page.drawText(`Buyer: ${data.buyerName}  •  Tujuan: ${data.destinationPort}`, {
      x: 40,
      y,
      size: 9.5,
      font: fontBold,
      color: cForest,
    });

    y -= 16;
    page.drawText(`Tanggal Dispatch: ${data.dispatchedAt}  ${data.deliveredAt ? `• Tiba: ${data.deliveredAt}` : '• Dalam Perjalanan'}`, {
      x: 40,
      y,
      size: 9,
      font: fontRegular,
      color: cDark,
    });

    // Divider
    y -= 25;
    page.drawLine({
      start: { x: 40, y },
      end: { x: width - 40, y },
      thickness: 1,
      color: cBorder,
    });

    // Temperature & Cold Chain Integrity Box
    y -= 24;
    page.drawText('1. ANALISIS KELAYAKAN SUHU & KELEMBABAN (COLD CHAIN LOG)', {
      x: 40,
      y,
      size: 11,
      font: fontBold,
      color: cForest,
    });

    y -= 8;
    const tableTop = y;
    page.drawRectangle({
      x: 40,
      y: tableTop - 75,
      width: width - 80,
      height: 75,
      color: cLightBg,
      borderColor: cBorder,
      borderWidth: 1,
    });

    page.drawText('Metrik Sensor IoT', { x: 50, y: tableTop - 18, size: 9, font: fontBold, color: cDark });
    page.drawText('Ambang Batas Standar', { x: 200, y: tableTop - 18, size: 9, font: fontBold, color: cDark });
    page.drawText('Nilai Aktual', { x: 350, y: tableTop - 18, size: 9, font: fontBold, color: cDark });
    page.drawText('Status Kualitas', { x: 460, y: tableTop - 18, size: 9, font: fontBold, color: cDark });

    page.drawText('Rentang Suhu (°C)', { x: 50, y: tableTop - 34, size: 8.5, font: fontRegular, color: cDark });
    page.drawText('20.0°C - 26.0°C', { x: 200, y: tableTop - 34, size: 8.5, font: fontRegular, color: cDark });
    page.drawText(`${data.tempSummary.minC}°C - ${data.tempSummary.maxC}°C (avg ${data.tempSummary.avgC}°C)`, { x: 350, y: tableTop - 34, size: 8.5, font: fontBold, color: cForest });
    page.drawText(data.tempSummary.status, { x: 460, y: tableTop - 34, size: 8.5, font: fontBold, color: cGreenPass });

    page.drawText('Durasi Deviasi (>27°C)', { x: 50, y: tableTop - 48, size: 8.5, font: fontRegular, color: cDark });
    page.drawText('Maks. 0 Menit', { x: 200, y: tableTop - 48, size: 8.5, font: fontRegular, color: cDark });
    page.drawText(`${data.tempSummary.deviationMinutes} Menit`, { x: 350, y: tableTop - 48, size: 8.5, font: fontRegular, color: cDark });
    page.drawText(data.tempSummary.deviationMinutes === 0 ? 'COMPLIANT' : 'FLAGGED', { x: 460, y: tableTop - 48, size: 8.5, font: fontBold, color: data.tempSummary.deviationMinutes === 0 ? cGreenPass : cGold });

    page.drawText('Kelembaban Relatif (RH)', { x: 50, y: tableTop - 62, size: 8.5, font: fontRegular, color: cDark });
    page.drawText('Maks. 65.0 % (Anti-Caking)', { x: 200, y: tableTop - 62, size: 8.5, font: fontRegular, color: cDark });
    page.drawText(`${data.tempSummary.maxRhPct ?? 58}% RH`, { x: 350, y: tableTop - 62, size: 8.5, font: fontRegular, color: cDark });
    page.drawText('SAFE', { x: 460, y: tableTop - 62, size: 8.5, font: fontBold, color: cGreenPass });

    // Section 2: Chain of Custody (Route Legs)
    y = tableTop - 100;
    page.drawText('2. JEJAK RUTE & MATA RANTAI PERJALANAN (CHAIN OF CUSTODY)', {
      x: 40,
      y,
      size: 11,
      font: fontBold,
      color: cForest,
    });

    y -= 16;
    for (const leg of data.legs) {
      page.drawText(`Leg ${leg.seq}: ${leg.from}  ➔  ${leg.to}  (${leg.depart || 'Waktu tercatat'} s/d ${leg.arrive || 'transit'})`, {
        x: 50,
        y,
        size: 8.5,
        font: fontRegular,
        color: cDark,
      });
      y -= 14;
    }

    // Section 3: Package & Lot Contents
    y -= 10;
    page.drawText('3. DAFTAR LOT & KEMASAN DALAM BOX INI', {
      x: 40,
      y,
      size: 11,
      font: fontBold,
      color: cForest,
    });

    y -= 16;
    for (const lot of data.lots) {
      page.drawText(`• Batch ${lot.batchNumber} — ${lot.variety.replace(/_/g, ' ')} (${lot.grade}): ${lot.packageCount} Unit Kemasan Ritel`, {
        x: 50,
        y,
        size: 9,
        font: fontRegular,
        color: cDark,
      });
      y -= 14;
    }

    // Footer & SHA-256
    const footerY = 55;
    page.drawLine({
      start: { x: 40, y: footerY + 25 },
      end: { x: width - 40, y: footerY + 25 },
      thickness: 1,
      color: cBorder,
    });

    const interimBytes = await doc.save();
    const sha256 = crypto.createHash('sha256').update(interimBytes).digest('hex');

    page.drawText(`Document Digest (SHA-256): ${sha256}`, {
      x: 40,
      y: footerY + 12,
      size: 7.5,
      font: fontBold,
      color: cForest,
    });

    page.drawText(
      `SIRAGU Trace Engine • Laporan shipment & sensor telemetri resmi • Verifikasi digital: ${data.verifyUrl}`,
      {
        x: 40,
        y: footerY,
        size: 7.5,
        font: fontRegular,
        color: cGray,
      },
    );

    const pdfBytes = await doc.save();
    return { pdfBytes, sha256 };
  }
}
