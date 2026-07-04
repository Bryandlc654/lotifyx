import { EventsService } from "./events.service";
export declare class EventsController {
    private readonly service;
    constructor(service: EventsService);
    findAllPublished(): Promise<import("./event.entity").Event[]>;
    findAllAdmin(): Promise<import("./event.entity").Event[]>;
    findOne(id: string): Promise<import("./event.entity").Event | null>;
    create(dto: any): Promise<import("./event.entity").Event>;
    update(id: string, dto: any): Promise<{
        id: string;
        title: string;
        description: string;
        event_date: Date;
        location: string;
        image_url: string;
        status: string;
        created_at: Date;
        updated_at: Date;
    } & import("./event.entity").Event>;
    remove(id: string): Promise<import("./event.entity").Event>;
}
