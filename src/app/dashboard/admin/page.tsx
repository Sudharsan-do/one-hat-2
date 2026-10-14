"use client";

import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import { Download, Eye, LogOut, X, Check, AlertCircle, Video } from "lucide-react";
import { signOut } from "next-auth/react";
import { UploadSection } from "~/app/_components/admin/upload-button";
import { RejectSection } from "~/app/_components/admin/reject-button";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";

// Types
interface Script {
    id: string;
    userId: string;
    status: "PENDING" | "REJECTED" | "APPROVED";
    createdAt: Date;
    reason?: string | null;
    content: string;
    videoUrl?: string;
    user?: { email?: string };
}

interface FilterState {
    userId: string;
    email: string;
    scriptId: string;
    status: string;
}

interface CountState {
    pending: number;
    completed: number;
    rejected: number;
}

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
] as const;

const STATUS_COLORS = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    APPROVED: "bg-green-100 text-green-800 border-green-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
} as const;

const ScriptReviewDashboard = () => {
    const [selectedScript, setSelectedScript] = useState<Script | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [count, setCount] = useState<CountState>({
        pending: 0,
        completed: 0,
        rejected: 0,
    });
    const [filters, setFilters] = useState<FilterState>({
        userId: "",
        email: "",
        scriptId: "",
        status: "",
    });
    const [pageIndex, setPageIndex] = useState(0);
    const [data, setData] = useState<Script[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Memoized query parameters
    const queryParams = useMemo(
        () => ({
            userId: filters.userId,
            email: filters.email,
            scriptId: filters.scriptId,
            pageIndex,
            status: filters.status
                ? (filters.status as "PENDING" | "REJECTED" | "APPROVED")
                : undefined,
        }),
        [filters, pageIndex],
    );

    // API query hook
    const {
        data: queryResult,
        error,
        refetch,
        isPending,
    } = api.video.fetchScripts.useQuery(queryParams, {
        placeholderData: (prev) => prev,
        refetchOnWindowFocus: false,
    });

    // Handle review click
    const handleReviewClick = useCallback((script: Script) => {
        setSelectedScript(script);
        setIsModalOpen(true);
    }, []);

    // Handle download script
    const handleDownloadScript = useCallback(() => {
        if (!selectedScript?.content) return;

        try {
            const blob = new Blob([selectedScript.content], {
                type: "text/plain",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `script-${selectedScript.id}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download script");
            console.error("Download error:", error);
        }
    }, [selectedScript]);

    // Handle download video
    const handleDownloadVideo = useCallback(async () => {
        if (!selectedScript?.videoUrl) return;

        try {
            const response = await fetch(selectedScript.videoUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch video');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            
            // Extract file extension from URL or default to mp4
            const urlParts = selectedScript.videoUrl.split('.');
            const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1]?.split('?')[0] : 'mp4';
            
            a.download = `video-${selectedScript.id}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success("Video download started");
        } catch (error) {
            toast.error("Failed to download video");
            console.error("Video download error:", error);
        }
    }, [selectedScript]);

    const handleFilterChange = useCallback(
        (key: keyof FilterState, value: string) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                setFilters((prev) => ({ ...prev, [key]: value }));
                setPageIndex(0);
            }, 100);
        },
        [],
    );

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({ userId: "", email: "", scriptId: "", status: "" });
        setPageIndex(0);
    }, []);

    // Handle modal close
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedScript(null);
    }, []);

    // Handle action completion
    const handleActionComplete = useCallback(() => {
        handleCloseModal();
        void refetch();
    }, [handleCloseModal, refetch]);

    // Update data when query result changes
    useEffect(() => {
        if (queryResult) {
            setData(queryResult.list as Script[]);
            setCount({
                pending: queryResult.pendingCount,
                completed: queryResult.completedCount,
                rejected: queryResult.rejectedCount,
            });
        } else if (error) {
            toast.error("Failed to load scripts data");
            setData([]);
            console.error("Failed to load scripts data:", error);
        }
    }, [queryResult, error]);

    // Column definitions
    const columns = useMemo(() => {
        const columnHelper = createColumnHelper<Script>();

        return [
            columnHelper.accessor("id", {
                header: "Script ID",
                cell: (info) => (
                    <span className="font-mono text-sm text-blue-600">
                        {info.getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor("userId", {
                header: "User ID",
                cell: (info) => (
                    <span className="text-gray-700">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor("user.email", {
                header: "Email",
                cell: (info) => (
                    <span className="text-gray-700">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor("status", {
                header: "Status",
                cell: (info) => {
                    const status = info.getValue();
                    return (
                        <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}
                        >
                            {status.charAt(0).toUpperCase() +
                                status.slice(1).toLowerCase()}
                        </span>
                    );
                },
            }),
            columnHelper.accessor("createdAt", {
                header: "Created At",
                cell: (info) => (
                    <span className="text-sm text-gray-600">
                        {new Date(info.getValue()).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                ),
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                cell: (info) => (
                    <button
                        onClick={() => handleReviewClick(info.row.original)}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        <Eye size={16} />
                        Review
                    </button>
                ),
            }),
        ];
    }, [handleReviewClick]);

    // Table configuration
    const table = useReactTable({
        data,
        columns,
        rowCount: count.pending + count.completed + count.rejected,
        state: {
            pagination: {
                pageIndex,
                pageSize: 10,
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        onPaginationChange: (updater) => {
            const newState =
                typeof updater === "function"
                    ? updater(table.getState().pagination)
                    : updater;
            setPageIndex(newState.pageIndex);
        },
    });

    // Handle sign out
    const handleSignOut = useCallback(() => {
        void signOut({ callbackUrl: "/" });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Script Review Dashboard
                            </h1>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Statistics Cards */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-8 w-8 text-yellow-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Pending Scripts
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {count.pending}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Check className="h-8 w-8 text-green-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Completed Scripts
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {count.completed}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <X className="h-8 w-8 text-red-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Rejected Scripts
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {count.rejected}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                            Filters
                        </h3>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                User ID
                            </label>
                            <input
                                type="text"
                                value={filters.userId}
                                onChange={(e) =>
                                    handleFilterChange("userId", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Filter by User ID"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="text"
                                value={filters.email}
                                onChange={(e) =>
                                    handleFilterChange("email", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Filter by Email"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Script ID
                            </label>
                            <input
                                type="text"
                                value={filters.scriptId}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "scriptId",
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Filter by Script ID"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) =>
                                    handleFilterChange("status", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* Loading Spinner Overlay */}
                    {isPending && (
                        <div className="bg-opacity-70 absolute inset-0 z-10 flex items-center justify-center bg-white">
                            <svg
                                className="h-10 w-10 animate-spin text-blue-600"
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
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                ></path>
                            </svg>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-gray-50"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-6 py-4 whitespace-nowrap"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{" "}
                                    <span className="font-medium">
                                        {table.getState().pagination.pageIndex *
                                            table.getState().pagination
                                                .pageSize +
                                            1}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-medium">
                                        {Math.min(
                                            (table.getState().pagination
                                                .pageIndex +
                                                1) *
                                                table.getState().pagination
                                                    .pageSize,
                                            count.pending +
                                                count.completed +
                                                count.rejected,
                                        )}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium">
                                        {count.pending +
                                            count.completed +
                                            count.rejected}
                                    </span>{" "}
                                    results
                                </p>
                            </div>
                            <div>
                                <nav
                                    className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
                                    aria-label="Pagination"
                                >
                                    <button
                                        onClick={() => table.setPageIndex(0)}
                                        disabled={!table.getCanPreviousPage()}
                                        className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                                        Page{" "}
                                        {table.getState().pagination.pageIndex +
                                            1}{" "}
                                        of {table.getPageCount()}
                                    </span>
                                    <button
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                    <button
                                        onClick={() =>
                                            table.setPageIndex(
                                                table.getPageCount() - 1,
                                            )
                                        }
                                        disabled={!table.getCanNextPage()}
                                        className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Last
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && selectedScript && (
                <div className="bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600">
                    <div className="relative top-20 mx-auto w-11/12 max-w-4xl rounded-md border bg-white p-5 shadow-lg">
                        <div className="mt-3">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Review Script: {selectedScript.id}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <h4 className="mb-2 font-medium text-gray-900">
                                        Script Details
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="font-medium">
                                                User ID:
                                            </span>{" "}
                                            {selectedScript.userId}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Email:
                                            </span>{" "}
                                            {selectedScript.user?.email}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Status:
                                            </span>{" "}
                                            {selectedScript.status}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Created:
                                            </span>{" "}
                                            {new Date(
                                                selectedScript.createdAt,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="mb-2 font-medium text-gray-900">
                                        Actions
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedScript.videoUrl && (
                                            <button
                                                onClick={handleDownloadVideo}
                                                className="flex w-full items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                                            >
                                                <Video size={16} />
                                                Download Video
                                            </button>
                                        )}
                                        <button
                                            onClick={handleDownloadScript}
                                            className="flex w-full items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                                        >
                                            <Download size={16} />
                                            Download Script
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="mb-2 font-medium text-gray-900">
                                    Script Content
                                </h4>
                                <div className="max-h-60 overflow-y-auto rounded-md bg-gray-50 p-4">
                                    <pre className="text-sm whitespace-pre-wrap text-gray-700">
                                        {selectedScript.content ||
                                            "No content available"}
                                    </pre>
                                </div>
                            </div>

                            {selectedScript.status === "PENDING" && (
                                <div className="space-y-6">
                                    <UploadSection
                                        scriptId={selectedScript.id}
                                        onComplete={handleActionComplete}
                                    />
                                    <RejectSection
                                        scriptId={selectedScript.id}
                                        onComplete={handleActionComplete}
                                    />
                                </div>
                            )}

                            {selectedScript.status === "REJECTED" &&
                                selectedScript.reason && (
                                    <div className="mt-4">
                                        <h4 className="mb-2 font-medium text-gray-900">
                                            Rejection Reason
                                        </h4>
                                        <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                            <p className="text-sm text-red-800">
                                                {selectedScript.reason}
                                            </p>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScriptReviewDashboard;