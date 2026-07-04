import { Repository } from "typeorm";
import { Tutorial } from "./tutorial.entity";
export declare class TutorialService {
    private readonly repo;
    constructor(repo: Repository<Tutorial>);
    findAllPublished(): Promise<Tutorial[]>;
    findAllAdmin(): Promise<Tutorial[]>;
    findOne(id: string): Promise<Tutorial | null>;
    create(dto: Partial<Tutorial>): Promise<Tutorial>;
    update(id: string, dto: Partial<Tutorial>): Promise<{
        id: string;
        title: string;
        description: string;
        video_url: string;
        image_url: string;
        status: string;
        created_at: Date;
        updated_at: Date;
    } & Tutorial>;
    remove(id: string): Promise<Tutorial>;
}
