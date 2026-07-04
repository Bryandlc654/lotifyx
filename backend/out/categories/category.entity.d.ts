export declare class Category {
    id: string;
    parent_id: string | null;
    parent: Category;
    children: Category[];
    name: string;
    slug: string;
    icon: string;
    status: string;
    created_at: Date;
}
