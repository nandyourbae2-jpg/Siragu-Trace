/**
 * Utility for exporting high-resolution QR codes and printable label badges.
 */

export interface QrBadgeOptions {
  url: string;
  codeTitle: string;
  badgeLabel: string;
  category: string;
  metadata: string[];
  filename: string;
}

/**
 * Download a pure high-resolution QR code PNG (800x800).
 */
export async function downloadQrCodePng(canvasElement: HTMLCanvasElement | null, filename: string) {
  if (!canvasElement) return;

  // Create a high-res 800x800 canvas
  const highResCanvas = document.createElement('canvas');
  highResCanvas.width = 800;
  highResCanvas.height = 800;
  const ctx = highResCanvas.getContext('2d');
  if (!ctx) return;

  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 800);

  // Draw the QR code scaled up with crisp edges
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvasElement, 60, 60, 680, 680);

  const dataUrl = highResCanvas.toDataURL('image/png');
  triggerDownload(dataUrl, `${filename}.png`);
}

/**
 * Generate and download a complete printable sticker label badge (PNG).
 * Includes branding, metadata, official badges, and instructions.
 */
export async function downloadPrintableLabelPng(
  canvasElement: HTMLCanvasElement | null,
  options: QrBadgeOptions,
) {
  if (!canvasElement) return;

  const width = 640;
  const height = 860;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background (White Card with subtle rounded border)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  // Inner dashed cutline
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(18, 18, width - 36, height - 36);
  ctx.setLineDash([]); // Reset line dash

  // 2. Top Header Banner (Brand Color: Forest Green #1B4D3E)
  ctx.fillStyle = '#1B4D3E';
  ctx.fillRect(20, 20, width - 40, 110);

  // Brand Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SIRAGU TRACE', width / 2, 60);

  // Brand Subtitle
  ctx.fillStyle = '#a7f3d0';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PASPOR KETERTELUSURAN GULA SEMUT ORGANIK', width / 2, 82);

  // Origin pill
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(width / 2 - 120, 94, 240, 24);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('KOPERASI NIRA LESTARI BANYUMAS', width / 2, 110);

  // 3. Category & Badge Tag
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(options.category.toUpperCase(), width / 2, 155);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(options.codeTitle, width / 2, 185);

  // 4. White Box for QR Code
  const qrBoxSize = 340;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 205;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

  // Draw QR Code
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvasElement, qrBoxX + 15, qrBoxY + 15, qrBoxSize - 30, qrBoxSize - 30);

  // 5. Instruction text
  ctx.fillStyle = '#0075DE';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📸 PINDAI DENGAN KAMERA HP (iOS / ANDROID)', width / 2, 575);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Arahkan kamera untuk memeriksa keaslian & riwayat rantai pasok', width / 2, 595);

  // 6. Metadata Box (Information Details)
  const metaBoxY = 615;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(35, metaBoxY, width - 70, 160);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(35, metaBoxY, width - 70, 160);

  // Metadata items
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  options.metadata.slice(0, 5).forEach((line, index) => {
    const yPos = metaBoxY + 28 + index * 26;
    ctx.fillText(line, 50, yPos);
  });

  // 7. Footer URL
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 10px monospace';
  ctx.fillText(options.url, width / 2, 805);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('SNI 3743:2021 • EU ORGANIC CU-892182 • BPOM MD • HALAL BPJPH', width / 2, 825);

  const dataUrl = canvas.toDataURL('image/png');
  triggerDownload(dataUrl, `${options.filename}_LABEL_SIAP_CETAK.png`);
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
