"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    extractScriptData,
    InputArea,
    MessagesArea,
    ScriptSidebar,
    type Message,
    type ScriptData,
    type Suggestion,
} from "~/app/_components/dashboard/message-area";
import Sidebar from "~/app/_components/dashboard/side-bar";
import { Header } from "~/app/_components/dashboard/header";
import { VideosContent } from "~/app/_components/dashboard/videos-content";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid';

interface SendMessageResponse {
    message: string;
}

const TRENDING_SUGGESTIONS: Suggestion[] = [
    { id: "1", text: "Winter flu symptoms", icon: "🤒" },
    { id: "2", text: "Healthy sleep habits", icon: "😴" },
    { id: "3", text: "Exercise for beginners", icon: "💪" },
    { id: "4", text: "Stress management tips", icon: "🧘" },
    { id: "5", text: "Nutrition guidelines", icon: "🥗" },
    { id: "6", text: "Mental health support", icon: "🧠" },
];

const fetchTrendingSuggestions = async (): Promise<Suggestion[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return TRENDING_SUGGESTIONS;
};

export default function DoctorChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("ai-chat");
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
    const [scriptData, setScriptData] = useState<ScriptData | undefined>(undefined);
    const [isScriptSidebarOpen, setIsScriptSidebarOpen] = useState<boolean>(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { data: fetchedMessages } = api.messages.fetchMessages.useQuery();
    
    const sendMessageMutation = api.messages.send.useMutation({
        onSuccess: (data: SendMessageResponse) => {
            const aiResponse: Message = {
                id: uuidv4(),
                content: data.message,
                role: "assistant",
            };
            setMessages((prev) => [...prev, aiResponse]);
            setIsTyping(false);
        },
        onError: (error) => {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message. Please try again later.");
            setIsTyping(false);
        },
    });
    
    const finalizeMutation = api.messages.finalize.useMutation({
        onSuccess: () => {
            setMessages([]);
            setInput("");
            toast.success("Video generation started! Starting new chat...");
            setIsGeneratingVideo(false);
        },
        onError: (error) => {
            console.error("Failed to generate video:", error);
            toast.error("Failed to generate video. Please try again.");
            setIsGeneratingVideo(false);
        },
    });

    const scrollToBottom = useCallback((): void => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent): Promise<void> => {
            e.preventDefault();
            const trimmedInput = input.trim();
            if (!trimmedInput || isGeneratingVideo) return;
            
            const userMessage: Message = {
                id: uuidv4(),
                content: trimmedInput,
                role: "user",
            };
            setMessages((prev) => [...prev, userMessage]);
            setInput("");
            setIsTyping(true);
            sendMessageMutation.mutate(trimmedInput);
        },
        [input, isGeneratingVideo, sendMessageMutation],
    );

    const handleSuggestionClick = useCallback(
        (suggestionText: string): void => {
            if (!isGeneratingVideo) {
                setInput(suggestionText);
            }
        },
        [isGeneratingVideo],
    );

    const finalizeScript = useCallback(
        (script: string, title: string): void => {
            setIsGeneratingVideo(true);
            finalizeMutation.mutate({ script, title });
        },
        [finalizeMutation],
    );

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (fetchedMessages) {
            setMessages(fetchedMessages);
        }
    }, [fetchedMessages]);

    useEffect(() => {
        let isMounted = true;
        const loadSuggestions = async () => {
            try {
                const data = await fetchTrendingSuggestions();
                if (isMounted) {
                    setSuggestions(data);
                }
            } catch (error) {
                console.error("Failed to load suggestions:", error);
                if (isMounted) {
                    setSuggestions(TRENDING_SUGGESTIONS);
                }
            }
        };
        void loadSuggestions();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage?.role === "assistant") {
            const extractedData = extractScriptData(
                latestMessage.content,
                latestMessage.id,
            );
            if (extractedData) {
                setScriptData(extractedData);
                setIsScriptSidebarOpen(true);
            }
        }
    }, [messages]);

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            <div className="flex flex-1 flex-col">
                <Header setSidebarOpen={setSidebarOpen} activeTab={activeTab} />
                {activeTab === "ai-chat" ? (
                    <>
                        <MessagesArea
                            messages={messages}
                            isTyping={isTyping}
                            messagesEndRef={messagesEndRef}
                            setIsScriptSidebarOpen={setIsScriptSidebarOpen}
                            hasSidebar={isScriptSidebarOpen}
                        />
                        <InputArea
                            input={input}
                            setInput={setInput}
                            handleSubmit={handleSubmit}
                            isTyping={isTyping}
                            suggestions={suggestions}
                            onSuggestionClick={handleSuggestionClick}
                            isFinalized={isGeneratingVideo}
                            hasSidebar={isScriptSidebarOpen}
                        />
                    </>
                ) : (
                    <VideosContent />
                )}
            </div>
            <ScriptSidebar
                scriptData={scriptData ?? null}
                isVisible={isScriptSidebarOpen}
                onGenerateVideo={finalizeScript}
                isGeneratingVideo={isGeneratingVideo}
                onHide={() => {
                    setIsScriptSidebarOpen(false);
                }}
            />
        </div>
    );
}