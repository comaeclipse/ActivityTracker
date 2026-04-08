import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type ActivityType = 'RUN' | 'WALK' | 'SWIM' | 'WEIGHTS' | 'BIKE' | 'HYDRATION';

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  value: number | null;
  unit: string | null;
  durationMinutes: number | null;
  notes: string | null;
  activityDate: string;
}

interface ReportOptions {
  username?: string;
  startDate?: string;
  endDate?: string;
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy');
}

function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy h:mm a');
}

function addReportHeader(doc: jsPDF, title: string, options: ReportOptions): number {
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  let y = 30;
  doc.setFontSize(10);

  if (options.username) {
    doc.text(`User: ${options.username}`, 14, y);
    y += 6;
  }

  if (options.startDate || options.endDate) {
    const range = `Date Range: ${options.startDate ? formatDate(options.startDate) : 'All'} to ${options.endDate ? formatDate(options.endDate) : 'Present'}`;
    doc.text(range, 14, y);
    y += 6;
  }

  doc.text(`Generated: ${formatDateTime(new Date())}`, 14, y);
  y += 10;

  return y;
}

export function generateActivityLogPDF(
  activities: ActivityRecord[],
  options: ReportOptions = {}
): jsPDF {
  const doc = new jsPDF('landscape');
  const startY = addReportHeader(doc, 'Activity Log Report', options);

  const tableData = activities.map((a) => [
    formatDate(a.activityDate),
    a.type,
    a.value !== null ? `${a.value} ${a.unit ?? ''}`.trim() : '—',
    a.durationMinutes !== null ? `${a.durationMinutes} min` : '—',
    a.notes ?? '',
  ]);

  autoTable(doc, {
    head: [['Date', 'Type', 'Value', 'Duration', 'Notes']],
    body: tableData,
    startY,
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 'auto' },
    },
    margin: { top: startY, left: 14, right: 14 },
  });

  return doc;
}

export function generateSummaryPDF(
  activities: ActivityRecord[],
  options: ReportOptions = {}
): jsPDF {
  const doc = new jsPDF();
  const startY = addReportHeader(doc, 'Activity Summary Report', options);

  const typeOrder: ActivityType[] = ['RUN', 'WALK', 'SWIM', 'WEIGHTS', 'BIKE', 'HYDRATION'];

  const tableData = typeOrder.map((type) => {
    const group = activities.filter((a) => a.type === type);
    if (group.length === 0) return [type, '0', '—', '—', '—'];

    const totalDuration = group.reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
    const totalValue = group.reduce((s, a) => s + (a.value ?? 0), 0);
    const unit = group.find((a) => a.unit)?.unit ?? '';
    const avgDuration = Math.round(totalDuration / group.length);

    return [
      type,
      group.length.toString(),
      totalDuration > 0 ? `${totalDuration} min` : '—',
      totalDuration > 0 ? `${avgDuration} min` : '—',
      totalValue > 0 ? `${totalValue.toFixed(1)} ${unit}`.trim() : '—',
    ];
  });

  // Totals row
  const totalCount = activities.length;
  const totalDuration = activities.reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
  tableData.push(['TOTAL', totalCount.toString(), totalDuration > 0 ? `${totalDuration} min` : '—', '—', '—']);

  autoTable(doc, {
    head: [['Activity Type', 'Sessions', 'Total Duration', 'Avg Duration', 'Total Value']],
    body: tableData,
    startY,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
    bodyStyles: { valign: 'middle' },
    // Bold the totals row
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
    margin: { top: startY, left: 14, right: 14 },
  });

  return doc;
}
