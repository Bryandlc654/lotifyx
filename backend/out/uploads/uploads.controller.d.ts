export declare class UploadsController {
    uploadGallery(files: Express.Multer.File[]): {
        urls: string[];
    };
    uploadImage(file: Express.Multer.File): {
        url: string;
    };
    uploadFile(file: Express.Multer.File): {
        url: string;
    };
}
