import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
    return createTRPCContext({
        headers: req.headers,
    });
};

const handler = async (req: NextRequest) => {
    // Add security headers
    const response = await fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: () => createContext(req),
        onError: ({ path, error }) => {
            // Log errors in development
            if (env.NODE_ENV === "development") {
                console.error(
                    `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
                );
            }

            // Don't expose internal errors to the client in production
            if (
                env.NODE_ENV === "production" &&
                error.code === "INTERNAL_SERVER_ERROR"
            ) {
                error.message = "Internal server error";
            }
        },
    });

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "same-origin");
    response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    );

    return response;
};

export { handler as GET, handler as POST };
