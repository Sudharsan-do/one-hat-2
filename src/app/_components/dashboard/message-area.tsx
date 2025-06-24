import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useState, useEffect } from "react";

export interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
}

export interface Suggestion {
    id: string;
    text: string;
    icon: string;
}

export interface ScriptData {
    title: string;
    script: string;
    messageId: string;
}

const titleRegex = /<title>(.*?)<\/title>/s;
const scriptRegex = /<script>(.*?)<\/script>/s;

// Utility function to extract script and title from message content
export function extractScriptData(
    content: string,
    messageId: string,
): ScriptData | null {
    const titleMatch = titleRegex.exec(content);
    const scriptMatch = scriptRegex.exec(content);

    if (titleMatch && scriptMatch) {
        return {
            title: titleMatch[1]?.trim() ?? "",
            script: scriptMatch[1]?.trim() ?? "",
            messageId,
        };
    }

    return null;
}

// Script Sidebar Component
export function ScriptSidebar({
    scriptData,
    isVisible,
    onGenerateVideo,
    isGeneratingVideo,
    onHide,
}: {
    scriptData: ScriptData | null;
    isVisible: boolean;
    onGenerateVideo: (script: string, title: string) => void;
    isGeneratingVideo: boolean;
    onHide?: () => void;
}) {
    const [localTitle, setLocalTitle] = useState(scriptData?.title ?? "");
    const [localScript, setLocalScript] = useState(scriptData?.script ?? "");

    useEffect(() => {
        if (scriptData) {
            setLocalTitle(scriptData.title);
            setLocalScript(scriptData.script);
        }
    }, [scriptData]);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 flex h-full w-96 flex-col border-l border-gray-200 bg-white shadow-lg"
        >
            {/* Header */}
            <div className="border-b border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                    <h3 className="flex items-center text-lg font-semibold text-gray-900">
                        <svg
                            className="mr-2 h-5 w-5 text-teal-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        Video Script Editor
                    </h3>
                    <div className="flex items-center">
                        <div className="flex items-center rounded-full bg-teal-50 px-2 py-1 text-xs text-gray-500 mr-2">
                            <div className="mr-2 h-2 w-2 rounded-full bg-teal-400"></div>
                            Avatar-based
                        </div>
                        {onHide && (
                            <button
                                onClick={onHide}
                                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                title="Close sidebar"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                    Edit your video title and script
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Title Section */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Video Title
                    </label>
                    <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => setLocalTitle(e.target.value)}
                        placeholder="Enter video title..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                {/* Script Section */}
                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Avatar Script
                    </label>
                    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="flex items-start">
                            <svg
                                className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-xs text-blue-700">
                                The avatar will read exactly what you write
                                here. Make sure the text flows naturally for
                                speech.
                            </p>
                        </div>
                    </div>
                    <textarea
                        value={localScript}
                        onChange={(e) => setLocalScript(e.target.value)}
                        placeholder="Enter the script for your avatar to read..."
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                        rows={12}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                        {localScript.length} characters • ~
                        {Math.ceil(localScript.split(" ").length / 150)} minutes
                        reading time
                    </div>
                </div>

                {/* Script Guidelines */}
                <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">
                        💡 Script Guidelines
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                        <li>• Use natural, conversational language</li>
                        <li>• Include pauses with punctuation</li>
                        <li>• Keep sentences clear and concise</li>
                        <li>• Avoid complex technical jargon</li>
                    </ul>
                </div>
            </div>

            {/* Footer with Generate Button */}
            <div className="border-t border-gray-200 bg-gray-50 p-4">
                <GenerateVideoButton
                    isGeneratingVideo={isGeneratingVideo}
                    onGenerateVideo={() => onGenerateVideo(localScript, localTitle)}
                />
            </div>
        </motion.div>
    );
}

const MessageBubble = React.memo(
    ({ message }: { message: Message }) => {
        // Function to render message content with script tags highlighted
        const renderMessageContent = (content: string) => {
            // Check if message contains script tags
            const hasScript =
                content.includes("<script>") && content.includes("</script>");
            const hasTitle =
                content.includes("<title>") && content.includes("</title>");

            if (hasScript || hasTitle) {
                // Replace script and title tags with highlighted versions
                const processedContent = content
                    .replace(
                        /<title>(.*?)<\/title>/gs,
                        '<div class="bg-blue-100 border border-blue-300 rounded p-2 my-2"><strong class="text-blue-800">Title:</strong> <span class="text-blue-700">$1</span></div>',
                    )
                    .replace(
                        /<script>(.*?)<\/script>/gs,
                        '<div class="bg-teal-100 border border-teal-300 rounded p-2 my-2"><strong class="text-teal-800">Script:</strong> <div class="text-teal-700 mt-1 whitespace-pre-wrap">$1</div></div>',
                    );

                return (
                    <div
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                    />
                );
            }

            return <p className="whitespace-pre-wrap">{content}</p>;
        };

        return (
            <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8"
            >
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            message.role === "user"
                                ? "bg-blue-500 text-white"
                                : "bg-teal-500 text-white"
                        }`}
                    >
                        {message.role === "user" ? "U" : "AI"}
                    </div>

                    {/* Message Content */}
                    <div className="min-w-0 flex-1">
                        <div className="mb-1">
                            <span className="text-sm font-medium text-gray-900">
                                {message.role === "user"
                                    ? "You"
                                    : "AI Assistant"}
                            </span>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700">
                            {renderMessageContent(message.content)}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    },
    (prevProps, nextProps) => {
        return prevProps.message.id === nextProps.message.id;
    },
);

MessageBubble.displayName = 'MessageBubble';

// Typing Indicator Component
function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                    AI
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-1">
                        <span className="text-sm font-medium text-gray-900">
                            AI Assistant
                        </span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0.2s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0.4s]" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Generate Video Button Component
function GenerateVideoButton({
    isGeneratingVideo,
    onGenerateVideo,
}: {
    isGeneratingVideo: boolean;
    onGenerateVideo: () => void;
}) {
    return (
        <button
            onClick={onGenerateVideo}
            disabled={isGeneratingVideo}
            className="w-full inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
        >
            {isGeneratingVideo ? (
                <>
                    <svg
                        className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Generating Video...
                </>
            ) : (
                <>
                    <svg
                        className="mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    Generate New Video
                </>
            )}
        </button>
    );
}

// Trending Suggestions Component
function TrendingSuggestions({
    suggestions,
    onSuggestionClick,
    isDisabled,
}: {
    suggestions: Suggestion[];
    onSuggestionClick: (suggestionText: string) => void;
    isDisabled: boolean;
}) {
    return (
        <div className="mb-4">
            <div className="mb-3 flex items-center">
                <svg
                    className="mr-2 h-4 w-4 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                    Trending Health Topics
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                    <button
                        key={suggestion.id}
                        onClick={() => onSuggestionClick(suggestion.text)}
                        disabled={isDisabled}
                        className={`inline-flex items-center rounded-full border px-3 py-2 text-sm transition-colors ${
                            isDisabled
                                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                : "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100"
                        }`}
                    >
                        <span className="mr-1">{suggestion.icon}</span>
                        {suggestion.text}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Welcome Screen Component
function WelcomeScreen() {
    return (
        <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <svg
                    className="h-8 w-8 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
                Welcome to your AI Health Assistant
            </h3>
            <p className="max-w-md text-gray-500">
                Ask me anything about your health, symptoms, or wellness tips.
                I&apos;m here to help!
            </p>
        </div>
    );
}

// Input Area Component
export function InputArea({
    input,
    setInput,
    handleSubmit,
    isTyping,
    suggestions,
    onSuggestionClick,
    isFinalized,
    hasSidebar,
}: {
    input: string;
    setInput: (input: string) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    isTyping: boolean;
    suggestions: Suggestion[];
    onSuggestionClick: (suggestionText: string) => void;
    isFinalized: boolean;
    hasSidebar?: boolean;
}) {
    return (
        <div
            className={`border-t border-gray-200 bg-white transition-all duration-300 ${hasSidebar ? "mr-96" : ""}`}
        >
            <div className="mx-auto max-w-4xl px-4 py-4">
                <TrendingSuggestions
                    suggestions={suggestions}
                    onSuggestionClick={onSuggestionClick}
                    isDisabled={isFinalized}
                />
                <div>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        void handleSubmit(e);
                                    }
                                }}
                                placeholder="Ask me about your health..."
                                disabled={isFinalized}
                                className={`w-full resize-none rounded-lg border px-4 py-3 pr-12 focus:ring-1 focus:outline-none ${
                                    isFinalized
                                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                                        : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                                }`}
                                rows={1}
                                style={{ minHeight: "44px" }}
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={
                                    !input.trim() || isTyping || isFinalized
                                }
                                className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                                    !input.trim() || isTyping || isFinalized
                                        ? "cursor-not-allowed bg-gray-300"
                                        : "bg-teal-500 text-white hover:bg-teal-600"
                                }`}
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new line
                    </div>
                </div>
            </div>
        </div>
    );
}


export function MessagesArea({
    messages,
    isTyping,
    messagesEndRef,
    hasSidebar,
    setIsScriptSidebarOpen
}: {
    messages: Message[];
    isTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    hasSidebar?: boolean;
    setIsScriptSidebarOpen: (open: boolean) => void;
}) {
    return (
        <div
            className={`flex-1 relative overflow-y-auto bg-white transition-all duration-300 ${hasSidebar ? "mr-96" : ""}`}
        >
            {!hasSidebar && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setIsScriptSidebarOpen(true)}
                    className="fixed top-20 right-0 mr-4 z-40 rounded-full bg-teal-500 p-3 text-white shadow-lg transition-colors hover:bg-teal-600"
                    title="Open script editor"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                </motion.button>
            )}
            <div className="mx-auto max-w-4xl px-4 py-6">
                {messages.length === 0 && <WelcomeScreen />}

                <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                        <MessageBubble key={index} message={message} />
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && <TypingIndicator />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}