import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, HttpCode, HttpStatus } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";

function mkdir(dir: string) {
  return (_req: any, _file: any, cb: (err: Error | null, dir: string) => void) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  };
}

const GALLERY_DEST = "./uploads/gallery";
const IMAGE_DEST = "./uploads/images";

@Controller("uploads")
export class UploadsController {
  @Post("gallery")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: diskStorage({ destination: mkdir(GALLERY_DEST), filename: name }),
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  uploadGallery(@UploadedFiles() files: Express.Multer.File[]) {
    return { urls: files.map(f => `/uploads/gallery/${f.filename}`) };
  }

  @Post("image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({ destination: mkdir(IMAGE_DEST), filename: name }),
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/images/${file.filename}` };
  }
}

function name(_req: any, file: Express.Multer.File, cb: (err: Error | null, name: string) => void) {
  cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
}
