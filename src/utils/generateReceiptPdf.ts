import { jsPDF } from 'jspdf';
import { DOCUMENT_REQUIREMENTS } from '../data/visaCatalog';
import { DossierStatus, VisaDossier } from '../types/visa';

function sanitizePdfText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u0153/g, 'oe')
    .replace(/\u0152/g, 'OE')
    .replace(/\u2022/g, '-')
    .replace(/\u00B7/g, '-');
}

function getStatusText(status: DossierStatus): string {
  switch (status) {
    case 'approuve':
      return 'APPROUVE - e-Visa delivre';
    case 'action_requise':
      return 'ACTION REQUISE - Complement demande';
    case 'verification_pieces':
      return 'VERIFICATION DES PIECES EN COURS';
    case 'en_instruction':
      return 'EN INSTRUCTION CONSULAIRE';
    case 'refuse':
      return 'REFUSE';
  }
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/src/assets/images/logo_visa_travelling_1794604358248.jpg');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadVisaReceiptPdf(dossier: VisaDossier): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(30, 58, 138); // #1E3A8A
  doc.rect(0, 0, pageWidth, 34, 'F');

  const logoDataUrl = await loadLogoDataUrl();
  let textStartX = margin;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', margin, 6, 22, 22);
      textStartX = margin + 26;
    } catch {
      textStartX = margin;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VISA TRAVELLING', textStartX, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    sanitizePdfText('Portail de demande de visa en ligne - Document officiel'),
    textStartX,
    22
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(dossier.reference, pageWidth - margin, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const emittedDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  doc.text(`Edite le ${emittedDate}`, pageWidth - margin, 22, { align: 'right' });

  // Main Document Heading
  let y = 46;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const mainTitle =
    dossier.status === 'approuve'
      ? "AUTORISATION ELECTRONIQUE DE VOYAGE (e-VISA)"
      : 'RECEPISSE OFFICIEL DE DEPOT DE DEMANDE DE VISA';
  doc.text(sanitizePdfText(mainTitle), margin, y);

  y += 7;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  if (dossier.status === 'approuve') {
    doc.setTextColor(21, 128, 61);
  } else if (dossier.status === 'action_requise') {
    doc.setTextColor(180, 83, 9);
  } else if (dossier.status === 'refuse') {
    doc.setTextColor(185, 28, 28);
  } else {
    doc.setTextColor(30, 58, 138);
  }
  doc.text(`Statut du dossier : ${sanitizePdfText(getStatusText(dossier.status))}`, margin + 4, y + 6.5);

  // Applicant & Travel Details Box
  y += 16;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. Informations du titulaire et du sejour', margin, y);

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  const col1X = margin;
  const col2X = margin + contentWidth / 2 + 4;

  const drawField = (label: string, value: string, x: number, posY: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePdfText(label), x, posY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(sanitizePdfText(value), x, posY + 4.8);
  };

  drawField('Titulaire', dossier.applicantFullName, col1X, y);
  drawField('Numero de passeport', dossier.passportNumber, col2X, y);
  y += 13;

  drawField('Nationalite', dossier.nationality, col1X, y);
  drawField('Adresse e-mail', dossier.email, col2X, y);
  y += 13;

  drawField('Destination demandee', dossier.destinationName, col1X, y);
  drawField(
    'Categorie & entrees',
    `${dossier.visaCategoryLabel} (${dossier.entryType === 'multiple' ? 'Entrees multiples' : 'Simple entree'})`,
    col2X,
    y
  );
  y += 13;

  drawField('Dates du sejour', `Du ${dossier.arrivalDate} au ${dossier.departureDate}`, col1X, y);
  drawField('Droits consulaires acquittes', `${dossier.totalFeeEur} EUR`, col2X, y);
  y += 14;

  // Submitted Documents Section
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const docsList = Object.values(dossier.documents);
  doc.text(`2. Pieces justificatives deposees (${docsList.length})`, margin, y);

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8.8);
  docsList.forEach((item) => {
    const title = DOCUMENT_REQUIREMENTS[item.docId]?.title ?? item.docId;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`- ${sanitizePdfText(title)}`, margin + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      sanitizePdfText(`${item.fileName} (${item.fileSizeKb} Ko)`),
      pageWidth - margin,
      y,
      { align: 'right' }
    );
    y += 5.5;
  });

  // Timeline Section
  y += 6;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text("3. Journal d'instruction consulaire", margin, y);

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  dossier.timeline.forEach((step) => {
    if (y > 260) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(step.completed || step.current ? 15 : 148, step.completed || step.current ? 23 : 163, step.completed || step.current ? 42 : 184);
    doc.text(sanitizePdfText(`[${step.completed ? 'OK' : step.current ? 'EN COURS' : 'ATTENTE'}] ${step.label}`), margin + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePdfText(step.date), pageWidth - margin, y, { align: 'right' });
    y += 4.5;

    if (step.note) {
      const wrappedNote = doc.splitTextToSize(sanitizePdfText(step.note), contentWidth - 6);
      doc.text(wrappedNote, margin + 6, y);
      y += wrappedNote.length * 4 + 1;
    } else {
      y += 1.5;
    }
  });

  // Legal Notice & Assistance Footer
  const footerY = 272;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const legalText =
    dossier.status === 'approuve'
      ? "Ce document atteste de la delivrance de l'autorisation electronique de sejour. Presentez-le lors de l'embarquement avec le passeport mentionne ci-dessus."
      : 'Ce recepisse atteste du depot de votre demande de visa sur le portail Visa Travelling. Conservez votre numero de dossier pour le suivi en ligne.';
  const wrappedLegal = doc.splitTextToSize(sanitizePdfText(legalText), contentWidth);
  doc.text(wrappedLegal, margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(
    'Visa Travelling - Assistance client WhatsApp : 695613056',
    margin,
    footerY + 11
  );

  const filePrefix = dossier.status === 'approuve' ? 'evisa' : 'recepisse';
  doc.save(`${filePrefix}_${dossier.reference}.pdf`);
}
