declare module "docx" {
  export class Document {
    constructor(options: any);
  }
  export class Paragraph {
    constructor(options: any);
  }
  export class TextRun {
    constructor(options: any);
  }
  export class Table {
    constructor(options: any);
  }
  export class TableRow {
    constructor(options: any);
  }
  export class TableCell {
    constructor(options: any);
  }
  export class Header {
    constructor(options: any);
  }
  export class Footer {
    constructor(options: any);
  }
  export class ImageRun {
    constructor(options: any);
  }
  export class PageNumber {
    static CURRENT: any;
    static TOTAL_PAGES: any;
  }
  export const WidthType: {
    DXA: string;
    PERCENTAGE: string;
  };
  export const AlignmentType: {
    CENTER: string;
    LEFT: string;
    RIGHT: string;
    JUSTIFIED: string;
  };
  export const BorderStyle: {
    SINGLE: string;
    NONE: string;
  };
  export const NumberFormat: {
    DECIMAL: string;
  };
  export const HeadingLevel: {
    HEADING_1: string;
    HEADING_2: string;
    HEADING_3: string;
  };
  export class Packer {
    static toBlob(doc: Document): Promise<Blob>;
  }
}

declare module "file-saver" {
  export function saveAs(blob: Blob, filename: string): void;
}
