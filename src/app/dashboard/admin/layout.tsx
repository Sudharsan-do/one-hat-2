import { UserRole } from "@prisma/client";
import { ProtectedRoute } from "~/app/_components/protected-route";

export default function AdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            {children}
        </ProtectedRoute>
    );
}