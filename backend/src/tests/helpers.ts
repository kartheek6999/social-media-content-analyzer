import fs from 'fs';
import path from 'path';

// Valid 1-page PDF binary buffer with exact cross-platform byte offsets
export function getValidPdfBuffer(): Buffer {
  const content = 'BT /F1 12 Tf 50 700 Td (Social Media Strategy) Tj ET';
  const lines = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    'endobj',
    '4 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    '5 0 obj',
    `<< /Length ${content.length} >>`,
    'stream',
    content,
    'endstream',
    'endobj',
  ];

  let body = lines.join('\n') + '\n';
  
  const xrefOffset = Buffer.byteLength(body, 'utf-8');

  const offset1 = 9;
  const offset2 = body.indexOf('2 0 obj');
  const offset3 = body.indexOf('3 0 obj');
  const offset4 = body.indexOf('4 0 obj');
  const offset5 = body.indexOf('5 0 obj');

  const pad = (n: number) => n.toString().padStart(10, '0');

  const xref = [
    'xref',
    '0 6',
    '0000000000 65535 f ',
    `${pad(offset1)} 00000 n `,
    `${pad(offset2)} 00000 n `,
    `${pad(offset3)} 00000 n `,
    `${pad(offset4)} 00000 n `,
    `${pad(offset5)} 00000 n `,
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    'startxref',
    `${xrefOffset}`,
    '%%EOF',
  ].join('\n');

  return Buffer.from(body + xref, 'utf-8');
}

export async function createTestPdfFile(filename: string): Promise<string> {
  const assetsDir = path.join(process.cwd(), 'src/tests/assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const filePath = path.join(assetsDir, filename);
  fs.writeFileSync(filePath, getValidPdfBuffer());
  return filePath;
}
