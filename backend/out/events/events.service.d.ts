import { Repository } from "typeorm";
import { Event } from "./event.entity";
export declare class EventsService {
    private readonly repo;
    constructor(repo: Repository<Event>);
    findAllPublished(): Promise<Event[]>;
    findAllAdmin(): Promise<Event[]>;
    findOne(id: string): Promise<Event | null>;
    create(dto: Partial<Event>): Promise<Event>;
    update(id: string, dto: Partial<Event>): Promise<{
        id: string;
        title: string;
        description: string;
        event_date: Date;
        location: string;
        image_url: string;
        status: string;
        created_at: Date;
        updated_at: Date;
    } & Event>;
    remove(id: string): Promise<Event>;
}
