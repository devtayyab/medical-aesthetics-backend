// Medical record export as a real PDF file (client-side, jsPDF + autoTable).
// Data comes from GET /clinic/patients/:id/medical-record, which the backend
// scopes to the requesting clinic's own appointments.
// DejaVu Sans is embedded so Greek characters render correctly.
import dejavuRegularUrl from 'dejavu-fonts-ttf/ttf/DejaVuSans.ttf?url';
import dejavuBoldUrl from 'dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf?url';

const ATHENS_TZ = 'Europe/Athens';
const FONT = 'DejaVuSans';

const fmtAthensDateTime = (d: string | Date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: ATHENS_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(d))
    .replace(',', '');

const fmtEuro = (n: any) =>
  n === null || n === undefined || n === '' ? '-' : `€${Number(n).toFixed(2)}`;

const fontCache: Record<string, string> = {};
const loadFontBase64 = async (url: string): Promise<string> => {
  if (fontCache[url]) return fontCache[url];
  const buf = await (await fetch(url)).arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  fontCache[url] = btoa(binary);
  return fontCache[url];
};

const STATUS_EL: Record<string, string> = {
  pending: 'Σε αναμονή',
  confirmed: 'Επιβεβαιωμένο',
  completed: 'Ολοκληρωμένο',
  cancelled: 'Ακυρωμένο',
  no_show: 'Δεν προσήλθε',
  in_progress: 'Σε εξέλιξη',
  executed: 'Ολοκληρωμένο',
};

export const exportMedicalRecordPdf = async (
  record: any,
  isGreek: boolean,
): Promise<void> => {
  const [{ jsPDF }, { default: autoTable }, regular, bold] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadFontBase64(dejavuRegularUrl),
    loadFontBase64(dejavuBoldUrl),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addFileToVFS('DejaVuSans.ttf', regular);
  doc.addFont('DejaVuSans.ttf', FONT, 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', bold);
  doc.addFont('DejaVuSans-Bold.ttf', FONT, 'bold');

  const t = (el: string, en: string) => (isGreek ? el : en);
  const p = record?.patient || {};
  const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || t('Ασθενής', 'Patient');
  const appointments: any[] = record?.appointments || [];
  const clinics: string[] = record?.clinics || [];
  const margin = 14;

  doc.setFont(FONT, 'bold');
  doc.setFontSize(18);
  doc.text(t('Ιατρικό ιστορικό', 'Medical record'), margin, 20);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  const sub = `${clinics.join(', ')}${clinics.length ? ' · ' : ''}${t('Δημιουργήθηκε', 'Generated')} ${fmtAthensDateTime(record?.generatedAt || new Date())} (${t('ώρα Αθήνας', 'Athens time')})`;
  doc.text(doc.splitTextToSize(sub, 210 - margin * 2), margin, 27);

  doc.setTextColor(17);
  doc.setFontSize(11);
  let y = 38;
  const line = (label: string, value: string) => {
    doc.setFont(FONT, 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont(FONT, 'normal');
    doc.text(value || '-', margin + 28, y);
    y += 6;
  };
  line(t('Όνομα', 'Name'), name);
  line(t('Τηλέφωνο', 'Phone'), p.phone || '-');
  line('Email', p.email || '-');

  y += 4;
  doc.setFont(FONT, 'bold');
  doc.setFontSize(12);
  doc.text(`${t('Ιστορικό ραντεβού', 'Appointment history')} (${appointments.length})`, margin, y);

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    styles: { font: FONT, fontSize: 8.5, cellPadding: 2, valign: 'top' },
    headStyles: { font: FONT, fontStyle: 'bold', fillColor: [17, 17, 17], textColor: [203, 255, 56] },
    columnStyles: { 3: { halign: 'right', cellWidth: 20 }, 5: { cellWidth: 50 } },
    head: [[
      t('Ημερομηνία', 'Date'),
      t('Θεραπεία', 'Treatment'),
      t('Κλινική', 'Clinic'),
      t('Τιμή', 'Price'),
      t('Κατάσταση', 'Status'),
      t('Σημειώσεις κλινικής', 'Clinic notes'),
    ]],
    body: appointments.length
      ? appointments.map((a) => [
          a.startTime ? fmtAthensDateTime(a.startTime) : '-',
          a.treatment || '-',
          a.clinicName || '',
          fmtEuro(a.price),
          isGreek ? STATUS_EL[a.status] || a.status || '-' : a.status || '-',
          a.clinicNotes || '',
        ])
      : [[{ content: t('Δεν υπάρχουν ραντεβού σε αυτή την κλινική.', 'No appointments at this clinic.'), colSpan: 6 }]],
  });

  const safeName = name.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`${t('Ιατρικο_ιστορικο', 'Medical_record')}_${safeName}_${date}.pdf`);
};
