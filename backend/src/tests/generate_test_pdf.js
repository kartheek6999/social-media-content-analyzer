import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generate() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('Social Media Content Strategy 2026\nAre you struggling with engagement?', {
    x: 50,
    y: 350,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });
  const pdfBytes = await pdfDoc.save();
  const targetPath = path.join(process.cwd(), 'src/tests/assets/valid_test.pdf');
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, pdfBytes);
  console.log('Saved PDF to', targetPath);
}

generate();
