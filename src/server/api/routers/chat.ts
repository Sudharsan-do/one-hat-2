import z from "zod";
import { createTRPCRouter, doctorProcedure } from "../trpc";
import type { Message } from "~/app/_components/dashboard/message-area";
import { PrismaSaver } from "~/lib/chat-model/prisma-checkpoint";
import { ChatOpenAI } from "node_modules/@langchain/openai/dist";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import path from "path";
import fs from "fs";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { env } from "~/env";

interface HeyGenResponse {
    error?: string,
    data: {
        video_id: string
    }
}

const model = new ChatOpenAI({
    model: "gpt-4.1-mini",
    temperature: 0.5,
    maxTokens: 1000,
});
const systemPrompt = loadSystemPrompt();
const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
]);

const chain = prompt.pipe(model).pipe(new StringOutputParser());

export const chatRouter = createTRPCRouter({
    send: doctorProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }): Promise<{ message: string }> => {
            const chainWithHistory = new RunnableWithMessageHistory({
                runnable: chain,
                inputMessagesKey: "input",
                historyMessagesKey: "chat_history",
                getMessageHistory: async (sessionId: string) => {
                    const chatHistory = new PrismaSaver(
                        sessionId,
                        ctx.session.user.id,
                    );
                    return chatHistory;
                },
            });
            const res = await chainWithHistory.invoke(
                { input },
                {
                    configurable: {
                        sessionId: ctx.session.sessionId,
                    },
                },
            );
            return {
                message: res,
            };
        }),
    fetchMessages: doctorProcedure.query(
        async ({ ctx }): Promise<Message[]> => {
            const obj = new PrismaSaver(
                ctx.session.sessionId,
                ctx.session.user.id,
            );
            const list = await obj.getMessages();
            return list.map((msg) => ({
                id: msg.id ?? "",
                content: msg.text,
                role: msg.getType() === "human" ? "user" : "assistant",
            }));
        },
    ),
    finalize: doctorProcedure
        .input(
            z.object({
                script: z.string(),
                title: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }): Promise<void> => {
            const sessionId = ctx.session.sessionId;
            let videoId = undefined;
            const [user, webhookData] = await Promise.all([
                ctx.db.user.findUnique({
                    where: {
                        id: ctx.session.user.id,
                    },
                    select: {
                        avatar_id: true,
                        voice_id: true,
                    },
                }),
                ctx.db.webhook.findUnique({
                    where: {
                        id: env.HEYGEN_AVATAR_WEBHOOK_ID,
                    },
                    select: {
                        endpoint_id: true,
                    },
                }),
            ]);
            console.log("Webhook data: ", webhookData);
            if (user?.avatar_id && user.voice_id && webhookData?.endpoint_id) {
                const jsonPayload = JSON.stringify(
                    genPayload(user, input, webhookData?.endpoint_id),
                );
                console.log("Gen Video req: ", jsonPayload);
                const response = await fetch(
                    env.HEYGEN_URL + "/v2/video/generate",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Api-Key": env.HEYGEN_API_KEY,
                        },
                        body: jsonPayload,
                    },
                );
                const temp: HeyGenResponse = (await response.json()) as HeyGenResponse;
                console.log("Gen video resp: ", temp);
                if (!temp.error) {
                    videoId = temp.data.video_id;
                }
            }
            await Promise.all([
                ctx.db.videoScript.create({
                    data: {
                        content: input.script,
                        userId: ctx.session.user.id,
                        title: input.title,
                        heyGenVideoId: videoId,
                    },
                }),
                PrismaSaver.deleteThread(sessionId),
            ]);
        }),
});

function genPayload(
    user: { avatar_id: string | null; voice_id: string | null },
    input: { title: string; script: string },
    endpoint_id: string,
) {
    return {
        video_inputs: [
            {
                character: {
                    type: "avatar",
                    avatar_id: user.avatar_id,
                    avatar_style: "normal",
                },
                voice: {
                    type: "text",
                    input_text: input.script,
                    voice_id: user.voice_id,
                    speed: 1.1,
                },
            },
        ],
        dimension: {
            width: 1280,
            height: 720,
        },
        callback_id: endpoint_id,
    };
}

function loadSystemPrompt() {
    const file_path = path.join(process.cwd(), "system-prompt.txt");

    try {
        const content = fs.readFileSync(file_path, "utf-8");
        return content;
    } catch (error) {
        console.error("Error reading system prompt file:", error);
        return "";
    }
}
