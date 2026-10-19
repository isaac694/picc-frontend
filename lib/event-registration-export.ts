export type ExportColumn = {
  key: string;
  label: string;
};

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadRegistrationsExcel(input: {
  fileName: string;
  columns: ExportColumn[];
  rows: Array<Record<string, string>>;
}) {
  const header = input.columns
    .map((column) => `<Cell><Data ss:Type="String">${xmlEscape(column.label)}</Data></Cell>`)
    .join('');
  const body = input.rows
    .map((row) => {
      const cells = input.columns
        .map((column) => `<Cell><Data ss:Type="String">${xmlEscape(row[column.key] || '')}</Data></Cell>`)
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Registrations">
    <Table>
      <Row>${header}</Row>
      ${body}
    </Table>
  </Worksheet>
</Workbook>`;

  downloadBlob(new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }), input.fileName);
}

export async function downloadRegistrationsPdf(input: {
  title: string;
  fileName: string;
  columns: ExportColumn[];
  rows: Array<Record<string, string>>;
}) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: input.columns.length > 4 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usable = pageWidth - margin * 2;
  const columnWidth = usable / Math.max(input.columns.length, 1);
  const lineHeight = 4;
  let y = margin;

  const paintHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(input.title, margin, y + 4);
    y += 8;
    doc.setFontSize(8);
    const headerLines = input.columns.map((column) => doc.splitTextToSize(column.label, columnWidth - 2));
    const headerHeight = Math.max(...headerLines.map((lines) => lines.length), 1) * lineHeight + 3;
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, usable, headerHeight, 'F');
    headerLines.forEach((lines, index) => {
      doc.text(lines, margin + index * columnWidth + 1, y + 3.4);
    });
    y += headerHeight;
    doc.setFont('helvetica', 'normal');
  };

  paintHeader();

  input.rows.forEach((row) => {
    const cells = input.columns.map((column) => doc.splitTextToSize(row[column.key] || '—', columnWidth - 2));
    const rowHeight = Math.max(...cells.map((lines) => lines.length), 1) * lineHeight + 2.4;
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      paintHeader();
    }
    doc.setDrawColor(226);
    doc.line(margin, y + rowHeight, margin + usable, y + rowHeight);
    cells.forEach((lines, index) => {
      doc.text(lines, margin + index * columnWidth + 1, y + 3.4);
    });
    y += rowHeight;
  });

  doc.save(input.fileName);
}
