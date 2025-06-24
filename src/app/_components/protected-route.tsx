import type { UserRole } from "@prisma/client";
import { auth } from "~/server/auth";

interface Props {
    children: Readonly<React.ReactNode>;
    allowedRoles: UserRole[];
}

export async function ProtectedRoute({children, allowedRoles}: Props) {
    const session = await auth();

    if(session && allowedRoles.includes(session.user.role)) {
        return <>{children}</>;
    }

    return <><h1>Not Authorized.</h1></>;
}
