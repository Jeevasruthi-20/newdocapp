const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const generatePrescriptionPdf = async (prescription, baseUrl = 'http://localhost:3000') => {
  const verifyUrl = `${baseUrl}/verify/${prescription.verificationId}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#0069c0');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
      .text('MedConnect', 50, 25);
    doc.fontSize(10).font('Helvetica')
      .text('Digital Prescription — Verified Healthcare Document', 50, 52);

    doc.fillColor('#1e293b').moveDown(3);
    doc.fontSize(14).font('Helvetica-Bold').text('PRESCRIPTION', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
      .text(`Verification ID: ${prescription.verificationId}`, { align: 'center' });
    doc.moveDown(1.5);

    // Doctor & patient info
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Prescribing Doctor');
    doc.font('Helvetica').fontSize(10).fillColor('#475569');
    doc.text(`Dr. ${prescription.doctorName}`);
    if (prescription.doctorSpecialization) doc.text(prescription.doctorSpecialization);
    doc.text(prescription.hospitalName);
    if (prescription.hospitalAddress) doc.text(prescription.hospitalAddress);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fillColor('#1e293b').text('Patient');
    doc.font('Helvetica').fillColor('#475569');
    doc.text(prescription.patientName);
    doc.text(`Consultation Date: ${new Date(prescription.consultationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    if (prescription.diagnosis) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor('#1e293b').text('Diagnosis: ');
      doc.font('Helvetica').fillColor('#475569').text(prescription.diagnosis, { continued: true });
    }
    doc.moveDown(1.5);

    // Medicines table header
    doc.rect(50, doc.y, doc.page.width - 100, 22).fill('#f0f7ff');
    const tableY = doc.y - 22;
    doc.fillColor('#0069c0').fontSize(9).font('Helvetica-Bold');
    doc.text('Medicine', 55, tableY + 6, { width: 120 });
    doc.text('Dosage', 175, tableY + 6, { width: 80 });
    doc.text('Frequency', 255, tableY + 6, { width: 80 });
    doc.text('Instructions', 335, tableY + 6, { width: 200 });
    doc.moveDown(0.5);

    prescription.medicines.forEach((med, i) => {
      const y = doc.y;
      if (i % 2 === 0) doc.rect(50, y, doc.page.width - 100, 28).fill('#f8fafc');
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica');
      doc.text(med.name, 55, y + 8, { width: 115 });
      doc.text(med.dosage, 175, y + 8, { width: 75 });
      doc.text(med.frequency || '—', 255, y + 8, { width: 75 });
      doc.text(med.instructions || med.duration || '—', 335, y + 8, { width: 195 });
      doc.y = y + 32;
    });

    if (prescription.notes) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fillColor('#1e293b').text('Additional Notes');
      doc.font('Helvetica').fillColor('#475569').text(prescription.notes);
    }

    doc.moveDown(2);
    doc.font('Helvetica-Bold').fillColor('#1e293b').text('Digital Signature');
    doc.font('Helvetica-Oblique').fillColor('#0069c0').text(prescription.digitalSignature || 'Authorized Physician');

    // QR code
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, doc.page.width - 150, doc.page.height - 150, { width: 90 });
    doc.fontSize(8).fillColor('#64748b')
      .text('Scan to verify', doc.page.width - 150, doc.page.height - 55, { width: 90, align: 'center' });

    doc.fontSize(8).fillColor('#94a3b8')
      .text('This is a digitally generated prescription from MedConnect. For verification, visit medconnect.app/verify', 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });

    doc.end();
  });
};

module.exports = { generatePrescriptionPdf };
