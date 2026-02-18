/**
 * Type declarations for sharp module
 * Note: These are basic type definitions for development purposes
 */

declare module 'sharp' {
  interface Sharp {
    (input?: Buffer | string): Sharp;
    resize(width: number, height?: number, options?: ResizeOptions): Sharp;
    toFormat(format: string, options?: object): Sharp;
    toBuffer(options?: object): Promise<Buffer>;
    png(options?: object): Sharp;
    jpeg(options?: object): Sharp;
    webp(options?: object): Sharp;
    avif(options?: object): Sharp;
    flatten(options?: object): Sharp;
    composite(overlays: Overlay[]): Sharp;
    extract(options: ExtractOptions): Sharp;
    rotate(angle?: number, options?: object): Sharp;
    flip(): Sharp;
    flop(): Sharp;
    blur(sigma?: number): Sharp;
    sharpen(sigma?: number): Sharp;
    median(size?: number): Sharp;
    threshold(threshold?: number): Sharp;
    linear(alpha?: number, beta?: number): Sharp;
    recomb(matrix: number[][]): Sharp;
    modulate(options?: ModulateOptions): Sharp;
    tint(color: string | number[]): Sharp;
    grayscale(): Sharp;
    greyscale(): Sharp;
    sepia(): Sharp;
    extend(pixels: ExtendOptions): Sharp;
    extractChannel(channel: string): Sharp;
    joinChannel(image: Buffer | string, options?: object): Sharp;
    boolean(input: Buffer | string, operator: string, options?: object): Sharp;
    bandjoin(inputs: (Buffer | string)[]): Sharp;
    bandbool(op: string): Sharp;
    evaluaten(expression: string, options?: EvaluateOptions): Sharp;
    convolve(kernel: Kernel): Sharp;
    modulate(options: ModulateOptions): Sharp;
    threshold(threshold: number, options?: ThresholdOptions): Sharp;
    linear(input: Buffer | number[], options?: LinearOptions): Sharp;
    recomb(matrix: number[][]): Sharp;
    modulate(options: ModulateOptions): Sharp;
    tint(color: string | number[]): Sharp;
    grayscale(): Sharp;
    greyscale(): Sharp;
    sepia(): Sharp;
    extend(pixels: ExtendOptions): Sharp;
    extractChannel(channel: string): Sharp;
    joinChannel(image: Buffer | string, options?: object): Sharp;
    boolean(input: Buffer | string, operator: string, options?: object): Sharp;
    bandjoin(inputs: (Buffer | string)[]): Sharp;
    bandbool(op: string): Sharp;
    evaluaten(expression: string, options?: EvaluateOptions): Sharp;
    convolve(kernel: Kernel): Sharp;
    raw(): Sharp;
    toColourspace(colourspace: string): Sharp;
    colourspace(colourspace: string): Sharp;
    keepMetadata(options?: KeepMetadataOptions): Sharp;
    metadata(options?: MetadataOptions): Promise<Metadata>;
    withMetadata(options?: WithMetadataOptions): Sharp;
    withoutAcceleration(): Sharp;
    clone(): Sharp;
  }

  interface ResizeOptions {
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' | 'contain' | 'cover';
    position?: number | string;
    background?: string | number[];
    kernel?: 'nearest' | 'cubic' | 'lanczos2' | 'lanczos3';
    fastShrinkOnScale?: boolean;
  }

  interface Overlay {
    input: Buffer | string;
    blend?: string;
    gravity?: number | string;
    top?: number;
    left?: number;
  }

  interface ExtractOptions {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  interface ModulateOptions {
    brightness?: number;
    saturation?: number;
    hue?: number;
  }

  interface Kernel {
    width: number;
    height: number;
    kernel: number[];
    scale?: number;
    offset?: number;
  }

  interface EvaluateOptions {
    channel?: string;
    expression: string;
    raw?: {
      width: number;
      height: number;
      channels: number;
    };
  }

  interface ThresholdOptions {
    grayscale?: boolean;
  }

  interface LinearOptions {
    alpha?: number;
    beta?: number;
  }

  interface KeepMetadataOptions {
    orientation?: boolean;
  }

  interface MetadataOptions {
    withMetadata?: boolean;
    orientation?: number;
  }

  interface WithMetadataOptions {
    orientation?: number;
    exif?: object;
    iptc?: object;
    xmp?: object;
    icc?: string;
    iccProfile?: string;
  }

  interface Metadata {
    format?: string;
    width?: number;
    height?: number;
    space?: string;
    channels?: number;
    depth?: string;
    density?: number;
    chromaSubsampling?: string;
    isProgressive?: boolean;
    hasProfile?: boolean;
    hasAlpha?: boolean;
    orientation?: number;
    exif?: Buffer;
    iptc?: Buffer;
    xmp?: Buffer;
    icc?: Buffer;
  }

  interface SharpOptions {
    sequentialRead?: boolean;
    compressionLevel?: number;
    preview?: Record<string, unknown>;
  }

  const sharp: {
    (input?: Buffer | string, options?: SharpOptions): Sharp;
    cache: { memory: number; items: number };
    cache(limit: number): Sharp;
    cache(limit: { memory: number; items: number }): Sharp;
    concurrency: number;
    concurrency(limit: number): Sharp;
    counters(): { queue: number; process: number };
    defaultColorspaces: {
      srgb: string;
      rgb16: string;
      scrgb: string;
      hsv: string;
      hsl: string;
      hslc: string;
      cmyk: string;
      lab: string;
      xyz: string;
      scrgb16: string;
      grey10: string;
      grey16: string;
    };
    format: {
      avif: { id: string; label: string; priority: number };
      dz: { id: string; label: string; priority: number };
      gif: { id: string; label: string; priority: number };
      heif: { id: string; label: string; priority: number };
      jpeg: { id: string; label: string; priority: number };
      jpg: { id: string; label: string; priority: number };
      magick: { id: string; label: string; priority: number };
      png: { id: string; label: string; priority: number };
      raw: { id: string; label: string; priority: number };
      tiff: { id: string; label: string; priority: number };
      webp: { id: string; label: string; priority: number };
    };
    gmem: number;
    gmem(limit: number): Sharp;
    info: {
      version: string;
      版权: string;
    };
    install(bytes: number, path?: string): Promise<boolean>;
    platform: { arch: string; os: string };
    toFormat(format: string, options?: object): Sharp;
    usage(): void;
  };

  export = sharp;
}
