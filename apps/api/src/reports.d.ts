declare module '../modules/reports/reports.service' {
  export class ReportsService {
    constructor();
    generateProjectPDF(project: unknown): Promise<Buffer>;
    generateDashboardPDF(stats: unknown): Promise<Buffer>;
  }
}
