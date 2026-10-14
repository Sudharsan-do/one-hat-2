"use client";

import { AlertCircle, Upload, X } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { env } from "~/env";
import { api } from "~/trpc/react";
import { upload } from "@imagekit/next";
import { v4 as uuidv4 } from "uuid";

interface UploadSectionProps {
    scriptId: string;
    onComplete?: () => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/avi",
    "video/mov",
    "video/wmv",
];

export function UploadSection({ scriptId, onComplete }: UploadSectionProps) {
    const [state, setState] = useState<UploadState>("idle");
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: credentials, isLoading } =
        api.video.authUploadVideo.useQuery();
    const approveMutation = api.video.approveScript.useMutation();

    const validateFile = useCallback((file: File): string | null => {
        if (!SUPPORTED_TYPES.includes(file.type)) {
            return `Unsupported file type. Please upload: ${SUPPORTED_TYPES.join(", ")}`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large. Max: ${MAX_FILE_SIZE / (1024 * 1024)}MB, Current: ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
        }
        return null;
    }, []);

    const resetState = useCallback(() => {
        setFile(null);
        setState("idle");
        setProgress(0);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    }, []);

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            setError(null);

            if (!selectedFile) {
                setFile(null);
                return;
            }

            const validationError = validateFile(selectedFile);
            if (validationError) {
                toast.error(validationError);
                setError(validationError);
                setState("error");
                return;
            }

            setFile(selectedFile);
            setState("idle");
            setProgress(0);
            toast.success(`File selected: ${selectedFile.name}`);
        },
        [validateFile],
    );

    const handleCancel = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setState("idle");
        setProgress(0);
        toast.success("Upload cancelled");
    }, []);

    const handleUpload = useCallback(async () => {
        if (!file) return toast.error("Please select a video file first");
        if (!credentials)
            return toast.error("Upload credentials not available");

        const { token, expire, signature } = credentials;
        if (!token || !expire || !signature)
            return toast.error("Invalid upload credentials");

        try {
            setState("uploading");
            setProgress(0);
            setError(null);

            abortRef.current = new AbortController();

            const response = await upload({
                expire,
                token,
                signature,
                publicKey: env.NEXT_PUBLIC_IMAGEKIT_KEY,
                file,
                fileName: `${uuidv4()}_${file.name}`,
                onProgress: (e) =>
                    setProgress(Math.round((e.loaded / e.total) * 95)),
                abortSignal: abortRef.current.signal,
            });

            if (response.$ResponseMetadata?.statusCode === 200) {
                setProgress(100);
                await approveMutation.mutateAsync({
                    scriptId,
                    videoUrl: response.url ?? "",
                });

                setState("success");
                toast.success("Video uploaded and approved successfully!");
                setTimeout(() => {
                    resetState();
                    onComplete?.();
                }, 2000);
            } else {
                throw new Error(
                    `Upload failed with status: ${response.$ResponseMetadata?.statusCode}`,
                );
            }
        } catch (err) {
            let message = "Upload failed. Please try again.";
            if (err instanceof Error) {
                if (err.name === "AbortError") return;
                console.error("Upload error:", err);
                message = err.message || message;
            }

            toast.error(message);
            setError(message);
            setState("error");
        } finally {
            abortRef.current = null;
        }
    }, [file, credentials, scriptId, approveMutation, onComplete, resetState]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const buttonClass = `relative px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-[200px] disabled:cursor-not-allowed ${
        state === "uploading"
            ? "bg-blue-500 text-white"
            : state === "success"
              ? "bg-green-500 text-white"
              : state === "error"
                ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                : file && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-gray-300 text-gray-500"
    }`;

    const buttonContent = {
        uploading: (
            <div className="flex w-full items-center space-x-2">
                <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-blue-200">
                        <div
                            className="h-1.5 rounded-full bg-white transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        ),
        success: (
            <div className="flex items-center space-x-2">
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
                        d="M5 13l4 4L19 7"
                    />
                </svg>
                <span>Upload Successful!</span>
            </div>
        ),
        error: (
            <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Upload Failed - Retry</span>
            </div>
        ),
        idle: (
            <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>{isLoading ? "Loading..." : "Upload Video"}</span>
            </div>
        ),
    }[state];

    const formatSize = (bytes: number) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h4 className="mb-2 font-medium text-gray-900">
                    Upload Video (Required for Approval)
                </h4>
                <p className="text-sm text-gray-600">
                    Supported formats: MP4, WebM, OGG, AVI, MOV, WMV (Max:{" "}
                    {MAX_FILE_SIZE / (1024 * 1024)}MB)
                </p>
            </div>

            <div className="space-y-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept={SUPPORTED_TYPES.join(",")}
                    onChange={handleFileSelect}
                    disabled={state === "uploading"}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />

                {file && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatSize(file.size)}
                            </p>
                        </div>
                        {state !== "uploading" && (
                            <button
                                onClick={resetState}
                                className="ml-2 p-1 text-gray-400 transition-colors hover:text-red-500"
                                title="Remove file"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                {error && state === "error" && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex space-x-3">
                <button
                    onClick={handleUpload}
                    disabled={
                        state === "uploading" ||
                        !file ||
                        isLoading ||
                        state === "success"
                    }
                    className={buttonClass}
                >
                    {buttonContent}
                </button>
                {state === "uploading" && (
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
