"use client";

import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";

export function RejectSection({ scriptId, onComplete }: { scriptId: string; onComplete?: () => void }) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const rejectMutation = api.video.rejectScript.useMutation({
        onSuccess: () => {
            toast.success("Script rejected successfully");
            setReason("");
            setLoading(false);
            onComplete?.();
        },
        onError: (err) => {
            toast.error(`Failed to reject script: ${err.message}`);
            setLoading(false);
        },
    });

    const handleReject = () => {
        setLoading(true);
        rejectMutation.mutate({ scriptId, reason });
    };

    return (
        <>
            <div>
                <h4 className="mb-2 font-medium text-gray-900">Rejection Reason (Required for Rejection)</h4>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={3}
                />
            </div>
            <div>
                <button
                    onClick={handleReject}
                    disabled={!reason.trim() || loading}
                    className="flex items-center gap-2 rounded-md bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <X size={16} />
                    {loading ? "Processing..." : "Reject"}
                </button>
            </div>
        </>
    );
}