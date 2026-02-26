declare module "pdf2pic" {
  type ConvertOptions = {
    format?: "png" | "jpeg";
  };

  type FromPathOptions = {
    density?: number;
  };

  type ConvertResult = {
    path?: string;
  };

  export function fromPath(
    pdfPath: string,
    options?: FromPathOptions,
  ): (page: number, options?: ConvertOptions) => Promise<ConvertResult>;
}
