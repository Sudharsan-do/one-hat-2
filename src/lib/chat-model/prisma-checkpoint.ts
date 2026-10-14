import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import {
    type BaseMessage,
    type StoredMessage,
    mapChatMessagesToStoredMessages,
    mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";
import { db } from "~/server/db";

interface StoredPostgresMessageData {
    name: string | undefined;
    role: string | undefined;
    content: string;
    additional_kwargs?: Record<string, unknown>;
    type: string;
    tool_call_id: string | undefined;
}

export class PrismaSaver extends BaseListChatMessageHistory {
    lc_namespace = ["lib", "chat-model", "prisma-checkpoint"];

    sessionId: string;
    userId: string;

    constructor(sessionId: string, userId: string) {
        super();
        this.sessionId = sessionId;
        this.userId = userId;
    }

    async getMessages(): Promise<BaseMessage[]> {
        const res = await db.chatHistory.findMany({
            where: {
                sessionId: this.sessionId,
                status: true,
            },
            orderBy: {
                id: "asc",
            },
            select: {
                message: true,
            },
        });

        const storedMessages: StoredMessage[] = res.map(
            (row: { message: unknown }) => {
                const msg = row.message as StoredPostgresMessageData;
                const { type, ...data } = msg;
                return { type, data };
            },
        );
        return mapStoredMessagesToChatMessages(storedMessages);
    }

    async addMessage(message: BaseMessage): Promise<void> {
        const { data, type } = mapChatMessagesToStoredMessages([message])[0] ?? {};

        await db.chatHistory.create({
            data: {
                sessionId: this.sessionId,
                userId: this.userId,
                message: {
                    ...data,
                    type,
                }
            },
        });
    }

    static async deleteThread(sessionId: string): Promise<void> {
        await db.chatHistory.updateMany({
            where: {
                sessionId,
            },
            data: {
                status: false,
            },
        });
    }
}
