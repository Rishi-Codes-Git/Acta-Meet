// @ts-ignore
import PDFDocument from 'pdfkit';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { MomContent } from '../types';
import { config } from '../config';

const COLORS = {
  brand: '#1E6F64',
  brandLight: '#EAF4F2',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#D9E4E2',
};

function formatMeetingType(type: string): string {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDateTime(value: Date | string | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value: Date | string | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatStatus(status: string | undefined): string {
  if (!status) return '-';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatPriority(priority: string | undefined): string {
  if (!priority) return '-';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function stripMarkdownFormatting(text: string | undefined): string {
  if (!text) return '';
  
  return text
    // Remove bold: **text** or __text__ -> text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic: *text* or _text_ -> text
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove markdown headings: ### text -> text
    .replace(/^#+\s+(.+)$/gm, '$1')
    // Remove bullet points but keep text: - text or * text -> text
    .replace(/^[\*\-]\s+/gm, '')
    .trim();
}

// Generate PDF
export async function generatePDF(mom: MomContent, meetingId: string): Promise<string> {
  const uploadsDir = config.upload.dir;
  const fileName = `mom_${meetingId}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const left = 48;
    const right = pageWidth - 48;
    const contentWidth = right - left;
    const bottomLimit = () => doc.page.height - 70;

    const ensureSpace = (requiredHeight: number) => {
      if (doc.y + requiredHeight > bottomLimit()) {
        doc.addPage();
      }
    };

    const sectionTitle = (title: string) => {
      ensureSpace(36);
      doc.moveDown(0.4);
      doc.fillColor(COLORS.brand).font('Helvetica-Bold').fontSize(12).text(title, left, doc.y);
      doc.moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).strokeColor(COLORS.border).lineWidth(1).stroke();
      doc.moveDown(0.7);
      doc.fillColor(COLORS.text);
    };

    doc.rect(0, 0, pageWidth, 90).fill(COLORS.brand);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(22).text('Acta', left, 24);
    doc.fillColor('white').font('Helvetica').fontSize(11).text('Minutes of Meeting', left, 52);
    doc.fillColor('white').font('Helvetica').fontSize(9).text(`Generated ${formatDateTime(new Date())}`, left, 68);
    doc.fillColor(COLORS.text);

    doc.y = 110;
    doc.font('Helvetica-Bold').fontSize(19).text(mom.meeting.title || 'Meeting Report', left, doc.y, { width: contentWidth });
    doc.moveDown(0.6);

    const infoRows = [
      ['Meeting Type', formatMeetingType(mom.meeting.type)],
      ['Date & Time', formatDateTime(mom.meeting.meeting_date)],
      ['Location', mom.meeting.location || '-'],
      ['Duration', mom.meeting.duration_minutes ? `${mom.meeting.duration_minutes} minutes` : '-'],
    ];
    doc.fontSize(10);
    infoRows.forEach(([label, value]) => {
      ensureSpace(16);
      doc.font('Helvetica-Bold').fillColor(COLORS.muted).text(`${label}:`, left, doc.y, { continued: true });
      doc.font('Helvetica').fillColor(COLORS.text).text(` ${value}`);
    });

    if (mom.meeting.objective) {
      sectionTitle('Meeting Objective');
      doc.font('Helvetica').fontSize(10).text(mom.meeting.objective, {
        width: contentWidth,
        align: 'left',
      });
      doc.moveDown(0.5);
    }

    sectionTitle('Participants');
    if (mom.participants.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted).text('No participants recorded.');
      doc.fillColor(COLORS.text);
    } else {
      mom.participants.forEach((participant) => {
        ensureSpace(15);
        const line = `${participant.name}${participant.email ? ` (${participant.email})` : ''}${participant.role !== 'attendee' ? ` - ${participant.role}` : ''}`;
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text(`• ${line}`, { width: contentWidth });
      });
    }

    if (mom.agenda_items.length > 0) {
      sectionTitle('Agenda');
      mom.agenda_items.forEach((item, index) => {
        ensureSpace(18);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text(`${index + 1}. ${item.title}`, { width: contentWidth });
        if (item.description) {
          doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(item.description, {
            width: contentWidth - 14,
            indent: 14,
          });
        }
      });
    }

    sectionTitle('Executive Summary');
    ensureSpace(70);
    const summaryTop = doc.y;
    const cleanedSummary = stripMarkdownFormatting(mom.summary) || 'No summary available.';
    const summaryHeight = Math.max(58, doc.heightOfString(cleanedSummary, { width: contentWidth - 24 }) + 20);
    doc.rect(left, summaryTop, contentWidth, summaryHeight).fill(COLORS.brandLight);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(10).text(cleanedSummary, left + 12, summaryTop + 10, {
      width: contentWidth - 24,
      align: 'left',
    });
    doc.y = summaryTop + summaryHeight + 8;

    if (mom.key_points.length > 0) {
      sectionTitle('Key Points');
      mom.key_points.forEach((point) => {
        ensureSpace(16);
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text(`• ${point}`, { width: contentWidth });
      });
    }

    if (mom.decisions.length > 0) {
      sectionTitle('Key Decisions');
      mom.decisions.forEach((decision) => {
        ensureSpace(16);
        const cleanedDecision = stripMarkdownFormatting(decision.content);
        const line = `${cleanedDecision}${decision.decided_by ? ` (${decision.decided_by})` : ''}`;
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text(`• ${line}`, { width: contentWidth });
      });
    }

    if (mom.action_items.length > 0) {
      sectionTitle('Action Items');
      const tableLeft = left;
      const tableWidth = contentWidth;
      const columns = [tableWidth * 0.38, tableWidth * 0.18, tableWidth * 0.16, tableWidth * 0.12, tableWidth * 0.16];
      const colX = [
        tableLeft,
        tableLeft + columns[0],
        tableLeft + columns[0] + columns[1],
        tableLeft + columns[0] + columns[1] + columns[2],
        tableLeft + columns[0] + columns[1] + columns[2] + columns[3],
      ];

      const drawHeader = () => {
        ensureSpace(30);
        const y = doc.y;
        doc.rect(tableLeft, y, tableWidth, 24).fill(COLORS.brand);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
        doc.text('Task', colX[0] + 6, y + 7, { width: columns[0] - 10 });
        doc.text('Assignee', colX[1] + 6, y + 7, { width: columns[1] - 10 });
        doc.text('Deadline', colX[2] + 6, y + 7, { width: columns[2] - 10 });
        doc.text('Priority', colX[3] + 6, y + 7, { width: columns[3] - 10 });
        doc.text('Status', colX[4] + 6, y + 7, { width: columns[4] - 10 });
        doc.fillColor(COLORS.text);
        doc.y = y + 24;
      };

      drawHeader();
      mom.action_items.forEach((item, index) => {
        const rowData = [
          item.title || '-',
          item.assignee_name || '-',
          formatDate(item.deadline),
          formatPriority(item.priority),
          formatStatus(item.status),
        ];

        const rowHeight = Math.max(
          26,
          doc.heightOfString(rowData[0], { width: columns[0] - 12 }) + 10,
          doc.heightOfString(rowData[1], { width: columns[1] - 12 }) + 10
        );

        if (doc.y + rowHeight > bottomLimit()) {
          doc.addPage();
          drawHeader();
        }

        const y = doc.y;
        doc.rect(tableLeft, y, tableWidth, rowHeight).fill(index % 2 === 0 ? '#FFFFFF' : '#F8FAFC');
        doc.strokeColor(COLORS.border).lineWidth(0.8).rect(tableLeft, y, tableWidth, rowHeight).stroke();

        let cursor = tableLeft;
        columns.forEach((w) => {
          doc.moveTo(cursor, y).lineTo(cursor, y + rowHeight).strokeColor(COLORS.border).lineWidth(0.8).stroke();
          cursor += w;
        });
        doc.moveTo(tableLeft + tableWidth, y).lineTo(tableLeft + tableWidth, y + rowHeight).strokeColor(COLORS.border).lineWidth(0.8).stroke();

        doc.fillColor(COLORS.text).font('Helvetica').fontSize(9);
        doc.text(rowData[0], colX[0] + 6, y + 5, { width: columns[0] - 10 });
        doc.text(rowData[1], colX[1] + 6, y + 5, { width: columns[1] - 10 });
        doc.text(rowData[2], colX[2] + 6, y + 5, { width: columns[2] - 10 });
        doc.text(rowData[3], colX[3] + 6, y + 5, { width: columns[3] - 10 });
        doc.text(rowData[4], colX[4] + 6, y + 5, { width: columns[4] - 10 });

        doc.y = y + rowHeight;
      });
    }

    doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(8).text(
      `Generated by Acta • ${formatDateTime(new Date())}`,
      left,
      doc.page.height - 40,
      { width: contentWidth, align: 'center' }
    );
    
    doc.end();
    
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

// Generate Word Document
export async function generateDocx(mom: MomContent, meetingId: string): Promise<string> {
  const uploadsDir = config.upload.dir;
  const fileName = `mom_${meetingId}_${Date.now()}.docx`;
  const filePath = path.join(uploadsDir, fileName);

  const headingOne = (text: string) =>
    new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 220, after: 120 },
    });

  const headingTwo = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          color: '1E6F64',
          size: 26,
        }),
      ],
      spacing: { before: 220, after: 90 },
      border: {
        bottom: { style: BorderStyle.SINGLE, color: 'D9E4E2', size: 1 },
      },
    });

  const cellBorders = {
    top: { style: BorderStyle.SINGLE, color: 'D9E4E2', size: 1 },
    bottom: { style: BorderStyle.SINGLE, color: 'D9E4E2', size: 1 },
    left: { style: BorderStyle.SINGLE, color: 'D9E4E2', size: 1 },
    right: { style: BorderStyle.SINGLE, color: 'D9E4E2', size: 1 },
  };

  const metadataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      ['Meeting Type', formatMeetingType(mom.meeting.type)],
      ['Date & Time', formatDateTime(mom.meeting.meeting_date)],
      ['Location', mom.meeting.location || '-'],
      ['Duration', mom.meeting.duration_minutes ? `${mom.meeting.duration_minutes} minutes` : '-'],
    ].map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              shading: { fill: 'F8FBFA' },
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true, size: 20, color: '4B5563' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value, size: 20 })],
                }),
              ],
            }),
          ],
        })
    ),
  });

  const actionItemsTable =
    mom.action_items.length > 0
      ? new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: ['Task', 'Assignee', 'Deadline', 'Priority', 'Status'].map((header, idx) =>
                new TableCell({
                  width: {
                    size: [38, 18, 16, 12, 16][idx],
                    type: WidthType.PERCENTAGE,
                  },
                  shading: { fill: '1E6F64' },
                  borders: cellBorders,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: header, bold: true, color: 'FFFFFF', size: 20 })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                })
              ),
            }),
            ...mom.action_items.map(
              (item) =>
                new TableRow({
                  children: [
                    item.title || '-',
                    item.assignee_name || '-',
                    formatDate(item.deadline),
                    formatPriority(item.priority),
                    formatStatus(item.status),
                  ].map(
                    (value, idx) =>
                      new TableCell({
                        width: {
                          size: [38, 18, 16, 12, 16][idx],
                          type: WidthType.PERCENTAGE,
                        },
                        borders: cellBorders,
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: value, size: 20 })],
                          }),
                        ],
                      })
                  ),
                })
            ),
          ],
        })
      : undefined;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'ACTA', bold: true, color: '1E6F64', size: 42 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Minutes of Meeting', size: 22, color: '4B5563' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
          }),
          headingOne(mom.meeting.title || 'Meeting Report'),
          metadataTable,
          ...(mom.meeting.objective
            ? [
                headingTwo('Meeting Objective'),
                new Paragraph({
                  children: [new TextRun({ text: mom.meeting.objective, size: 22 })],
                  spacing: { after: 100 },
                }),
              ]
            : []),
          headingTwo('Participants'),
          ...(mom.participants.length > 0
            ? mom.participants.map(
                (participant) =>
                  new Paragraph({
                    text: `${participant.name}${participant.email ? ` (${participant.email})` : ''}${participant.role !== 'attendee' ? ` - ${participant.role}` : ''}`,
                    bullet: { level: 0 },
                    spacing: { after: 40 },
                  })
              )
            : [new Paragraph({ text: 'No participants recorded.' })]),
          ...(mom.agenda_items.length > 0
            ? [
                headingTwo('Agenda'),
                ...mom.agenda_items.flatMap((item, index) => [
                  new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${item.title}`, bold: true, size: 21 })],
                    spacing: { after: 40 },
                  }),
                  ...(item.description
                    ? [
                        new Paragraph({
                          children: [new TextRun({ text: item.description, color: '4B5563' })],
                          spacing: { after: 40 },
                        }),
                      ]
                    : []),
                ]),
              ]
            : []),
          headingTwo('Executive Summary'),
          new Paragraph({
            children: [new TextRun({ text: stripMarkdownFormatting(mom.summary) || 'No summary available.', size: 22 })],
            spacing: { after: 100 },
          }),
          ...(mom.key_points.length > 0
            ? [
                headingTwo('Key Points'),
                ...mom.key_points.map(
                  (point) =>
                    new Paragraph({
                      text: point,
                      bullet: { level: 0 },
                      spacing: { after: 40 },
                    })
                ),
              ]
            : []),
          ...(mom.decisions.length > 0
            ? [
                headingTwo('Key Decisions'),
                ...mom.decisions.map(
                  (decision) =>
                    new Paragraph({
                      text: `${stripMarkdownFormatting(decision.content)}${decision.decided_by ? ` (${decision.decided_by})` : ''}`,
                      bullet: { level: 0 },
                      spacing: { after: 40 },
                    })
                ),
              ]
            : []),
          ...(actionItemsTable
            ? [headingTwo('Action Items'), actionItemsTable]
            : [headingTwo('Action Items'), new Paragraph({ text: 'No action items extracted for this meeting.' })]),
          new Paragraph({
            children: [new TextRun({ text: `Generated by Acta • ${formatDateTime(new Date())}`, italics: true, color: '6B7280', size: 16 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 280 },
          }),
        ],
      },
    ],
  });
  
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}
