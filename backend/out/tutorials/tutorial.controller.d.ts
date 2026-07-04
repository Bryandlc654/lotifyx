import { TutorialService } from "./tutorial.service";
export declare class TutorialController {
    private readonly service;
    constructor(service: TutorialService);
    findAllPublished(): Promise<import("./tutorial.entity").Tutorial[]>;
    findAllAdmin(): Promise<import("./tutorial.entity").Tutorial[]>;
    findOne(id: string): Promise<import("./tutorial.entity").Tutorial | null>;
    create(dto: any): Promise<import("./tutorial.entity").Tutorial>;
    update(id: string, dto: any): Promise<{
        id: string;
        title: string;
        description: string;
        video_url: string;
        image_url: string;
        status: string;
        created_at: Date;
        updated_at: Date;
    } & import("./tutorial.entity").Tutorial>;
    remove(id: string): Promise<import("./tutorial.entity").Tutorial>;
}
