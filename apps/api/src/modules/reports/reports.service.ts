/**
 * ReportsService
 * PDF generation service for projects and dashboards
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

interface ProjectData {
  id: string;
  code: string;
  name: string;
  description: string;
  stage: string;
  status: string;
  budget: number | null;
  spent: number | null;
  startDate: Date | null;
  targetDate: Date | null;
  creator: { fullName: string };
  members: Array<{ role: string; user?: { fullName: string } }>;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  projectsByStage: Array<{ stage: string; _count: number }>;
}

// Переводы
const STAGE_LABELS: Record<string, string> = {
  IDEA: 'Идея',
  CONCEPT: 'Концепт',
  DESIGN: 'Дизайн',
  PROTOTYPE: 'Прототип',
  TESTING: 'Тестирование',
  PRODUCTION: 'Производство',
  COMPLETED: 'Завершён',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активен',
  ON_HOLD: 'На паузе',
  CANCELLED: 'Отменён',
  COMPLETED: 'Завершён',
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU');
}

export class ReportsService {
  async generateProjectPDF(project: ProjectData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Отчёт по проекту ${project.code}`,
          Author: 'FELETI R&D System',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ===== ШАПКА =====
      doc.rect(0, 0, doc.page.width, 80).fill('#1e3a5f');

      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('FELETI R&D', 50, 25);

      doc.fontSize(12).font('Helvetica').text('Sistema upravleniya R&D proektami', 50, 52);

      doc.fillColor('#000000').moveDown(3);

      // ===== ЗАГОЛОВОК ОТЧЁТА =====
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e3a5f')
        .text(`Otchet po proektu: ${project.code}`, {
          align: 'center',
        });

      doc.fontSize(16).fillColor('#374151').text(project.name, { align: 'center' });

      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text(`Data sozdaniya: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });

      doc.moveDown(2);

      // ===== РАЗДЕЛИТЕЛЬ =====
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#3b82f6')
        .lineWidth(2)
        .stroke();

      doc.moveDown(1);

      // ===== ОСНОВНАЯ ИНФОРМАЦИЯ =====
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f').text('Osnovnaya informaciya');

      doc.moveDown(0.5);

      // Таблица данных
      const tableData = [
        ['Kod proekta:', project.code],
        ['Status:', STATUS_LABELS[project.status] || project.status],
        ['Stadiya:', STAGE_LABELS[project.stage] || project.stage],
        ['Rukovoditel:', project.creator.fullName],
        ['Data nachala:', formatDate(project.startDate)],
        ['Planovaya data:', formatDate(project.targetDate)],
      ];

      tableData.forEach(([label, value]) => {
        const y = doc.y;
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#374151')
          .text(label, 50, y, { width: 180 });

        doc.fontSize(11).font('Helvetica').fillColor('#111827').text(value, 230, y);

        doc.moveDown(0.6);
      });

      doc.moveDown(1);

      // ===== ОПИСАНИЕ =====
      if (project.description) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f').text('Opisanie proekta');

        doc.moveDown(0.5);

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#374151')
          .text(project.description, {
            width: doc.page.width - 100,
            align: 'justify',
          });

        doc.moveDown(1);
      }

      // ===== ФИНАНСЫ =====
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a5f').text('Finansovye pokazateli');

      doc.moveDown(0.5);

      const budget = Number(project.budget) || 0;
      const spent = Number(project.spent) || 0;
      const remaining = budget - spent;
      const progress = budget > 0 ? (spent / budget) * 100 : 0;

      const finData = [
        ['Byudzhet proekta:', formatMoney(budget)],
        ['Potracheno:', formatMoney(spent)],
        ['Ostatok:', formatMoney(remaining)],
        ['Ispolzovano:', `${progress.toFixed(1)}%`],
      ];

      finData.forEach(([label, value]) => {
        const y = doc.y;
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#374151')
          .text(label, 50, y, { width: 180 });

        let color = '#111827';
        if (label && label.includes('Ostatok')) {
          color = remaining < 0 ? '#ef4444' : '#22c55e';
        }

        doc.fontSize(11).font('Helvetica').fillColor(color).text(value, 230, y);

        doc.moveDown(0.6);
      });

      // Прогресс бар бюджета
      doc.moveDown(0.5);
      const barY = doc.y;
      const barWidth = doc.page.width - 100;
      const fillWidth = (barWidth * Math.min(progress, 100)) / 100;

      // Фон
      doc.rect(50, barY, barWidth, 16).fillColor('#e5e7eb').fill();

      // Заполнение
      let barColor = '#3b82f6';
      if (progress > 90) barColor = '#ef4444';
      else if (progress > 70) barColor = '#f59e0b';

      doc.rect(50, barY, fillWidth, 16).fillColor(barColor).fill();

      doc.moveDown(2);

      // ===== КОМАНДА =====
      if (project.members && project.members.length > 0) {
        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .strokeColor('#e5e7eb')
          .lineWidth(1)
          .stroke();

        doc.moveDown(1);

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1e3a5f')
          .text(`Komanda proekta (${project.members.length} chel.)`);

        doc.moveDown(0.5);

        project.members.forEach((member) => {
          doc
            .fontSize(11)
            .font('Helvetica')
            .fillColor('#374151')
            .text(`• ${member.user?.fullName || 'N/A'} — ${member.role}`);
          doc.moveDown(0.3);
        });
      }

      // ===== ФУТЕР =====
      const footerY = doc.page.height - 60;

      doc
        .moveTo(50, footerY)
        .lineTo(doc.page.width - 50, footerY)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(9)
        .fillColor('#9ca3af')
        .text(
          `FELETI R&D System | Sozdano: ${new Date().toLocaleString('ru-RU')}`,
          50,
          footerY + 10,
          { align: 'center', width: doc.page.width - 100 }
        );

      doc.end();
    });
  }

  async generateDashboardPDF(stats: DashboardStats): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Obshchiy otchet FELETI R&D',
          Author: 'FELETI R&D System',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Шапка
      doc.rect(0, 0, doc.page.width, 80).fill('#1e3a5f');

      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('FELETI R&D', 50, 25);

      doc.fontSize(12).font('Helvetica').text('Obshchiy analiticheskiy otchet', 50, 52);

      doc.fillColor('#000000').moveDown(3);

      // Заголовок
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e3a5f')
        .text('Analiticheskiy otchet', { align: 'center' });

      doc
        .fontSize(11)
        .fillColor('#6b7280')
        .text(`Period: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });

      doc.moveDown(2);

      // KPI
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1e3a5f')
        .text('Klyuchevye pokazateli (KPI)');

      doc.moveDown(0.5);

      const kpiData = [
        ['Vsego proektov:', stats.totalProjects.toString()],
        ['Aktivnye proekty:', stats.activeProjects.toString()],
        ['Obshchiy byudzhet:', formatMoney(stats.totalBudget)],
        ['Potracheno:', formatMoney(stats.totalSpent)],
        ['Ispolzovanie byudzheta:', `${stats.budgetUtilization.toFixed(1)}%`],
        ['Ostatok byudzheta:', formatMoney(stats.totalBudget - stats.totalSpent)],
      ];

      kpiData.forEach(([label, value]) => {
        const y = doc.y;
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#374151')
          .text(label, 50, y, { width: 220 });

        doc.fontSize(11).font('Helvetica').fillColor('#111827').text(value, 270, y);

        doc.moveDown(0.7);
      });

      doc.moveDown(1);

      // По стадиям
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#e5e7eb')
        .stroke();

      doc.moveDown(1);

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1e3a5f')
        .text('Raspredelenie po stadiyam');

      doc.moveDown(0.5);

      stats.projectsByStage.forEach((item) => {
        const label = STAGE_LABELS[item.stage] || item.stage;
        const count = item._count;
        const percent =
          stats.totalProjects > 0 ? ((count / stats.totalProjects) * 100).toFixed(0) : '0';

        const y = doc.y;

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#374151')
          .text(`${label}:`, 50, y, { width: 180 });

        doc.fillColor('#111827').text(`${count} pr. (${percent}%)`, 230, y);

        doc.moveDown(0.6);
      });

      // Футер
      const footerY = doc.page.height - 60;

      doc
        .moveTo(50, footerY)
        .lineTo(doc.page.width - 50, footerY)
        .strokeColor('#e5e7eb')
        .stroke();

      doc
        .fontSize(9)
        .fillColor('#9ca3af')
        .text(`FELETI R&D | ${new Date().toLocaleString('ru-RU')}`, 50, footerY + 10, {
          align: 'center',
          width: doc.page.width - 100,
        });

      doc.end();
    });
  }
}
