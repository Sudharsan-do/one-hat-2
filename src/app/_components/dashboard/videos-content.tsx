import React, { useState, useCallback } from "react";
import { Play, Download, RotateCcw, X, Send } from "lucide-react";
import type { Script } from "~/lib/types";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";
import Image from "next/image";

type StatusType = "PENDING" | "APPROVED" | "REJECTED";

interface StatusConfig {
    bg: string;
    text: string;
    label: string;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
    APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "APPROVED" },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "REJECTED" },
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "PENDING" },
};

const StatusBadge = ({ status }: { status: StatusType }) => {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
        >
            {config.label}
        </span>
    );
};

const VideoPlayer = ({
    videoUrl,
    onClose,
}: {
    videoUrl: string;
    onClose: () => void;
}) => {
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    };

    return (
        <div
            className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className="relative mx-4 w-full max-w-4xl">
                <button
                    onClick={onClose}
                    className="bg-opacity-50 hover:bg-opacity-70 absolute -top-12 right-0 z-10 rounded-full bg-black p-2 text-white hover:text-gray-300"
                    aria-label="Close video"
                >
                    <X className="h-6 w-6" />
                </button>
                <video
                    controls
                    autoPlay
                    className="h-auto max-h-[80vh] w-full rounded-lg"
                    src={videoUrl}
                    onClick={(e) => e.stopPropagation()}
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>
    );
};

interface RetryModalProps {
    script: Script;
    onClose: () => void;
    onSubmit: (feedback: string) => void;
}

const RetryModal = ({ script, onClose, onSubmit }: RetryModalProps) => {
    const [feedback, setFeedback] = useState("");

    const handleSubmit = useCallback(() => {
        onSubmit(feedback);
    }, [feedback, onSubmit]);

    return (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Retry Processing
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="mb-2 text-sm text-gray-600">
                        Script: <strong>{script.title}</strong>
                    </p>
                    <p className="mb-4 text-sm text-red-600">
                        Previous error: {script.reason}
                    </p>
                </div>

                <div className="mb-4">
                    <label
                        htmlFor="feedback"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Additional feedback or modifications (optional)
                    </label>
                    <textarea
                        id="feedback"
                        rows={4}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Describe any changes you'd like to make or additional requirements..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Send className="mr-1 h-4 w-4" />
                        Retry Processing
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusAlert = ({
    status,
    reason,
}: {
    status: StatusType;
    reason?: string;
}) => {
    if (status === "PENDING") {
        return (
            <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
                <div className="flex items-center">
                    <svg
                        className="mr-2 h-5 w-5 animate-spin text-yellow-600"
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
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <p className="text-sm text-yellow-800">
                        Processing in progress...
                    </p>
                </div>
            </div>
        );
    }

    if (status === "REJECTED") {
        return (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                <div className="flex items-start">
                    <svg
                        className="mt-0.5 mr-2 h-5 w-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-red-800">
                            Processing Failed
                        </p>
                        <p className="mt-1 text-sm text-red-700">{reason}</p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

interface ScriptCardProps {
    script: Script;
}

const ScriptCard = ({ script }: ScriptCardProps) => {
    const [showPlayer, setShowPlayer] = useState(false);
    const [showRetryModal, setShowRetryModal] = useState(false);
    const [videoDuration, setVideoDuration] = useState<string | null>(null);

    const retryMutation = api.video.giveUserFeedback.useMutation({
        onSuccess: () => {
            toast.success(
                "Feedback submitted successfully. Processing will be retried.",
            );
            setShowRetryModal(false);
        },
        onError: (error) => {
            toast.error(`Failed to submit feedback: ${error.message}`);
            setShowRetryModal(false);
        },
    });

    const handleVideoLoad = useCallback(
        (e: React.SyntheticEvent<HTMLVideoElement>) => {
            const video = e.currentTarget;
            const duration = video.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            setVideoDuration(
                `${minutes}:${seconds.toString().padStart(2, "0")}`,
            );
        },
        [],
    );

    const handleDownload = useCallback((videoUrl: string, title: string) => {
        const link = document.createElement("a");
        link.href = videoUrl;
        link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleRetrySubmit = useCallback(
        (feedback: string) => {
            retryMutation.mutate({
                scriptId: script.id,
                feedback,
            });
        },
        [retryMutation, script.id],
    );

    const isApproved = script.status === "APPROVED";
    const isRejected = script.status === "REJECTED";
    const hasVideo = script.videoUrl && script.thumbnailUrl;

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {script.title}
                                </h3>
                                <StatusBadge
                                    status={script.status as StatusType}
                                />
                            </div>
                            <p className="text-sm text-gray-500">
                                ID: {script.id}
                            </p>
                            <p className="text-sm text-gray-500">
                                Created:{" "}
                                {new Date(
                                    script.createdAt,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {isApproved && hasVideo && (
                        <div className="mb-4">
                            <div className="relative overflow-hidden rounded-lg bg-gray-100">
                                <Image
                                    src={
                                        script.thumbnailUrl ??
                                        "/images/placeholder-thumbnail.png"
                                    }
                                    alt={script.title}
                                    className="h-48 w-full rounded-lg object-cover"
                                    onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        if (img.src !== window.location.origin + "/images/placeholder-thumbnail.png") {
                                          img.src = "/images/placeholder-thumbnail.png";
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button
                                        onClick={() => setShowPlayer(true)}
                                        className="bg-opacity-50 hover:bg-opacity-70 rounded-full bg-black p-3 transition-all"
                                    >
                                        <Play className="h-6 w-6 fill-current text-white" />
                                    </button>
                                </div>
                                {videoDuration && (
                                    <div className="bg-opacity-75 absolute right-2 bottom-2 rounded bg-black px-2 py-1 text-xs text-white">
                                        {videoDuration}
                                    </div>
                                )}
                                <video
                                    className="hidden"
                                    src={script.videoUrl}
                                    onLoadedMetadata={handleVideoLoad}
                                    preload="metadata"
                                />
                            </div>
                        </div>
                    )}

                    <StatusAlert
                        status={script.status as StatusType}
                        reason={script.reason}
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {isApproved && hasVideo && (
                                <>
                                    <button
                                        onClick={() => setShowPlayer(true)}
                                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                    >
                                        <Play className="mr-1 h-4 w-4" />
                                        Watch
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDownload(
                                                script.videoUrl!,
                                                script.title,
                                            )
                                        }
                                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                    >
                                        <Download className="mr-1 h-4 w-4" />
                                        Download
                                    </button>
                                </>
                            )}
                            {isRejected && (
                                <button
                                    onClick={() => setShowRetryModal(true)}
                                    className="inline-flex items-center rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    <RotateCcw className="mr-1 h-4 w-4" />
                                    Retry
                                </button>
                            )}
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
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
                                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {showPlayer && script.videoUrl && (
                <VideoPlayer
                    videoUrl={script.videoUrl}
                    onClose={() => setShowPlayer(false)}
                />
            )}

            {showRetryModal && (
                <RetryModal
                    script={script}
                    onClose={() => setShowRetryModal(false)}
                    onSubmit={handleRetrySubmit}
                />
            )}
        </>
    );
};

const StatCard = ({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}) => (
    <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}
                    >
                        {icon}
                    </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="truncate text-sm font-medium text-gray-500">
                            {label}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                            {value}
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex-1 bg-white p-6">
        <div className="mx-auto max-w-4xl">
            <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <svg
                        className="h-8 w-8 text-gray-400"
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
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                    My Videos
                </h3>
                <p className="text-gray-500">
                    Your video library will appear here.
                </p>
            </div>
        </div>
    </div>
);

export function VideosContent() {
    const { data: scripts = [] } = api.video.fetchVideoForDoctor.useQuery();

    const stats = {
        successful: scripts.filter((s) => s.status === "APPROVED").length,
        pending: scripts.filter((s) => s.status === "PENDING").length,
        failed: scripts.filter((s) => s.status === "REJECTED").length,
    };

    if (scripts.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="min-h-screen flex-1 bg-gray-50 p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">
                        My Videos
                    </h1>
                    <p className="text-gray-600">
                        Manage your video scripts and generated content
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <StatCard
                            icon={
                                <svg
                                    className="h-5 w-5 text-green-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            }
                            label="Successful"
                            value={stats.successful}
                            color="bg-green-100"
                        />
                        <StatCard
                            icon={
                                <svg
                                    className="h-5 w-5 text-yellow-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            }
                            label="Pending"
                            value={stats.pending}
                            color="bg-yellow-100"
                        />
                        <StatCard
                            icon={
                                <svg
                                    className="h-5 w-5 text-red-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            }
                            label="Failed"
                            value={stats.failed}
                            color="bg-red-100"
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {scripts.map((script) => (
                        <ScriptCard key={script.id} script={script} />
                    ))}
                </div>
            </div>
        </div>
    );
}
