import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, HttpCode, HttpStatus, BadRequestException } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";
import { R2Storage } from "../r2/r2-storage";

function mkdir(dir: string) {
  return (_req: any, _file: any, cb: (err: Error | null, dir: string) => void) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  };
}

const FILE_DEST = "./uploads/files";

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FILES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function imageFilter(_req: any, file: Express.Multer.File, cb: (err: Error | null, ok: boolean) => void) {
  if (!ALLOWED_IMAGES.includes(file.mimetype)) cb(new BadRequestException("Formato de imagen no válido (JPG, PNG, WebP, GIF)"), false);
  else cb(null, true);
}

function fileFilter(_req: any, file: Express.Multer.File, cb: (err: Error | null, ok: boolean) => void) {
  if (!ALLOWED_FILES.includes(file.mimetype)) cb(new BadRequestException("Formato de archivo no válido (PDF, DOC, DOCX, TXT)"), false);
  else cb(null, true);
}

@Controller("uploads")
export class UploadsController {
  @Post("gallery")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: new R2Storage({ folder: "gallery" }),
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  uploadGallery(@UploadedFiles() files: Express.Multer.File[]) {
    return { urls: files.map(f => f.filename) };
  }

  @Post("image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: new R2Storage({ folder: "images" }),
      fileFilter: imageFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: file.filename };
  }

  @Post("file")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({ destination: mkdir(FILE_DEST), filename: name }),
      fileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/files/${file.filename}` };
  }
}

function name(_req: any, file: Express.Multer.File, cb: (err: Error | null, name: string) => void) {
  cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
}
