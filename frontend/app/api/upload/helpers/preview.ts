//**Purpose:** Given a path to a PDF file on disk, render the first page to an image, blur it, and return a JPEG
//buffer.

import sharp from "sharp";
import { fromPath } from "pdf2pic";

const PREVIEW_WIDTH = 400;
const BLUR_SIGMA = 6;

export async function generateBlurredFirstPageBuffer(pdfPath: string): Promise<Buffer> {
    const convert = fromPath(pdfPath, { density: 150 });
    const result = await convert(1, { format: "png" });
    if (!result?.path) throw new Error("Failed to render PDF first page");
    
    const blurred = await sharp(result.path)
        .resize(PREVIEW_WIDTH)
        .blur(BLUR_SIGMA)
        .jpeg({ quality: 80 })
        .toBuffer();
        
    return blurred;
}