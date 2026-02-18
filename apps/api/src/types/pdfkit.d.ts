/**
 * PDFKit type declarations
 */

declare module 'pdfkit' {
  interface PDFDocumentOptions {
    size?: string;
    margin?: number;
    info?: {
      Title?: string;
      Author?: string;
    };
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    on(event: 'data', callback: (chunk: Buffer) => void): this;
    on(event: 'end' | 'error', callback: () => void): this;
    on(event: 'error', callback: (err: Error) => void): this;
    end(): void;
    rect(x: number, y: number, width: number, height: number): this;
    fill(color?: string): this;
    fillColor(color: string): this;
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, x?: number, y?: number, options?: object): this;
    moveDown(lines?: number): this;
    moveTo(x1: number, y1: number): this;
    lineTo(x2: number, y2: number): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    stroke(): this;
    page: { width: number; height: number };
    y: number;
  }

  export = PDFDocument;
}
