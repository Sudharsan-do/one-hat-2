export interface Script {
    id: string;
    title: string;
    createdAt: Date;
    reason?: string;
    status: "APPROVED" | "REJECTED" | "PENDING";
    videoUrl?: string;
}
