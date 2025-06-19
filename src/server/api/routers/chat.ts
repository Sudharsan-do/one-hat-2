import z from "zod";
import { createTRPCRouter, doctorProcedure } from "../trpc";
import type { Message } from "~/app/_components/dashboard/message-area";
import { PrismaSaver } from "~/lib/chat-model/prisma-checkpoint";
import { ChatOpenAI } from "node_modules/@langchain/openai/dist";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

const finalizedScriptRegex = /^[^a-zA-Z0-9]*FINALIZED SCRIPT/;
const titleRegex = /^[^a-zA-Z0-9]*FINALIZED SCRIPT \((.*?)\)/;

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
        .mutation(
            async ({
                ctx,
                input,
            }): Promise<{ message: string; finalized: boolean }> => {
                const chainWithHistory = new RunnableWithMessageHistory({
                    runnable: chain,
                    inputMessagesKey: "input",
                    historyMessagesKey: "chat_history",
                    getMessageHistory: async (sessionId : string) => {
                        const chatHistory = new PrismaSaver(sessionId, ctx.session.user.id);
                        return chatHistory;
                    },
                });
                const res = await chainWithHistory.invoke(
                    { input },
                    {
                        configurable: {
                            sessionId: ctx.session.sessionId,
                        }
                    }
                );
                if(finalizedScriptRegex.test(res)) {
                    const arr = titleRegex.exec(res);
                    await ctx.db.videoScript.create({
                        data: {
                            userId: ctx.session.user.id,
                            content: res,
                            title: arr?.[1] ?? "Untitled Script",
                        },
                    });
                    return {
                        message: res,
                        finalized: true,
                    }
                }
                return {
                    message: res,
                    finalized: false,
                }
            },
        ),
    fetchMessages: doctorProcedure.query(
        async ({ ctx }): Promise<Message[]> => {
            const obj = new PrismaSaver(ctx.session.sessionId, ctx.session.user.id);
            const list = await obj.getMessages();
            return list.map((msg) => ({
                id: msg.id ?? "",
                content: msg.text,
                role: msg.getType() === "human" ? "user" : "assistant",
            }));
        },
    ),
    deleteMessages: doctorProcedure.mutation(
        async ({ ctx }): Promise<void> => {
            const sessionId = ctx.session.sessionId;
            await PrismaSaver.deleteThread(sessionId);
        },
    ),
});

function loadSystemPrompt() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const file_path = path.join(__dirname, "../../../../system-prompt.txt");

    try {
        const content = fs.readFileSync(file_path, "utf-8");
        return content;
    } catch (error) {
        console.error("Error reading system prompt file:", error);
        return "";
    }
}
