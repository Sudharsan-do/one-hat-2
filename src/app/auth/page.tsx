import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth } from "~/server/auth";
import AuthPage from "./auth-page";

export default async function AuthPageServer() {
    const session = await auth();
    console.log("Session in AuthPageServer:", session);

    if (session) {
        const userRole = session.user.role;
        console.log("User role in AuthPageServer:", userRole);
        if (userRole === UserRole.DOCTOR) {
            redirect("/dashboard/doctor");
        } else if (userRole === UserRole.USER) {
            redirect("/dashboard/user");
        } else {
            redirect("/dashboard/admin");
        }
    }
    
    return <AuthPage />;
}
