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

export interface NamedActivityRecord extends ActivityRecord {
  username: string;
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

// Local-day key ("YYYY-MM-DD") from an ISO/date string, using local time so a
// workout logged at 11pm doesn't shift into the next UTC day.
function localDayKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

function parseLocalDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function lastY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function activityValue(a: ActivityRecord): string {
  return a.value !== null ? `${a.value} ${a.unit ?? ''}`.trim() : '—';
}

function activityDuration(a: ActivityRecord): string {
  return a.durationMinutes !== null ? `${a.durationMinutes} min` : '—';
}

/**
 * One block per calendar day (chronological). Each block lists every user's
 * workouts for that day.
 */
export function generateByDayPDF(
  activities: NamedActivityRecord[],
  options: ReportOptions = {}
): jsPDF {
  const doc = new jsPDF('landscape');
  let y = addReportHeader(doc, 'Activity Report — By Day', options);
  const pageHeight = doc.internal.pageSize.getHeight();

  const byDay = new Map<string, NamedActivityRecord[]>();
  for (const a of activities) {
    const key = localDayKey(a.activityDate);
    const group = byDay.get(key) ?? [];
    group.push(a);
    byDay.set(key, group);
  }

  const days = [...byDay.keys()].sort(); // chronological (ascending)

  if (days.length === 0) {
    doc.setFontSize(11);
    doc.text('No activities to report.', 14, y);
    return doc;
  }

  for (const day of days) {
    const group = byDay
      .get(day)!
      .sort((a, b) => a.username.localeCompare(b.username));

    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(format(parseLocalDay(day), 'EEEE, MMM d, yyyy'), 14, y);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      head: [['User', 'Type', 'Value', 'Duration', 'Notes']],
      body: group.map((a) => [
        a.username,
        a.type,
        activityValue(a),
        activityDuration(a),
        a.notes ?? '',
      ]),
      startY: y + 3,
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 28 },
        2: { cellWidth: 34 },
        3: { cellWidth: 28 },
        4: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    y = lastY(doc) + 12;
  }

  return doc;
}

/**
 * One block per user (alphabetical). Each block lists that user's workouts in
 * chronological order.
 */
export function generateByUserPDF(
  activities: NamedActivityRecord[],
  options: ReportOptions = {}
): jsPDF {
  const doc = new jsPDF();
  let y = addReportHeader(doc, 'Activity Report — By User', options);
  const pageHeight = doc.internal.pageSize.getHeight();

  const byUser = new Map<string, NamedActivityRecord[]>();
  for (const a of activities) {
    const group = byUser.get(a.username) ?? [];
    group.push(a);
    byUser.set(a.username, group);
  }

  const usernames = [...byUser.keys()].sort((a, b) => a.localeCompare(b));

  if (usernames.length === 0) {
    doc.setFontSize(11);
    doc.text('No activities to report.', 14, y);
    return doc;
  }

  for (const name of usernames) {
    // ISO strings sort chronologically as plain strings.
    const group = byUser
      .get(name)!
      .sort((a, b) => String(a.activityDate).localeCompare(String(b.activityDate)));

    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    const totalDuration = group.reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(name, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `${group.length} activit${group.length === 1 ? 'y' : 'ies'}` +
        (totalDuration > 0 ? ` · ${totalDuration} min total` : ''),
      14,
      y + 5
    );

    autoTable(doc, {
      head: [['Date', 'Type', 'Value', 'Duration', 'Notes']],
      body: group.map((a) => [
        formatDate(a.activityDate),
        a.type,
        activityValue(a),
        activityDuration(a),
        a.notes ?? '',
      ]),
      startY: y + 9,
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 26 },
        2: { cellWidth: 30 },
        3: { cellWidth: 24 },
        4: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    y = lastY(doc) + 12;
  }

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
