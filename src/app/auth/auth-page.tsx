"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginSchema, signupSchema } from "~/lib/validations/auth";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import { signIn } from "next-auth/react";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full transform translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-teal-400/20 rounded-full transform -translate-x-32 translate-y-32"></div>
            </div>

            <div className="relative max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {isLogin ? "Welcome back" : "Create your account"}
                    </h1>
                    <p className="text-gray-600">
                        {isLogin
                            ? "Sign in to access your dashboard"
                            : "Join thousands of professionals using our platform"}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        {isLogin ? (
                            <LoginForm router={router} />
                        ) : (
                            <SignupForm router={router} setIsLogin={setIsLogin} />
                        )}
                    </div>

                    <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-3">
                                {isLogin
                                    ? "Don't have an account?"
                                    : "Already have an account?"}
                            </p>
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                            >
                                {isLogin ? "Sign up for free" : "Sign in instead"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-xs text-gray-500">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}

type RouterType = ReturnType<typeof useRouter>;


function LoginForm({ router }: { router: RouterType }) {
    const [isLoading, setIsLoading] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        setIsLoading(true);
        const result = loginSchema.safeParse({
            email: formData.get("email"),
            password: formData.get("password"),
        });

        if (!result.success) {
            setIsLoading(false);
            result.error.errors.forEach((error) => {
                toast.error(error.message);
                if (error.path[0] === "email" && emailRef.current) {
                    emailRef.current.focus();
                }
                if (error.path[0] === "password" && passwordRef.current) {
                    passwordRef.current.focus();
                }
            });
            return;
        }

        await LoginAction(formData, setIsLoading, router);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    required
                    className="mt-1 block w-full rounded-md border p-2"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <input
                    ref={passwordRef}
                    type="password"
                    name="password"
                    required
                    className="mt-1 block w-full rounded-md border p-2"
                />
            </div>
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white p-2 rounded-md disabled:opacity-50 flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                    </>
                ) : (
                    'Login'
                )}
            </button>
        </form>
    );
}

function SignupForm({
    setIsLogin,
}: {
    router: RouterType;
    setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const createUser = api.auth.signup.useMutation({
        onSuccess: () => {
            toast.success("Account created successfully! You can now sign in.");
            setIsLogin(true);
        },
        onError: (error) => {
            toast.error(`Error creating account: ${error.message}`);
            setIsLoading(false);
        },
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        setIsLoading(true);
        const result = signupSchema.safeParse({
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
        });

        if (!result.success) {
            setIsLoading(false);
            result.error.errors.forEach((error) => {
                toast.error(error.message);
                if (error.path[0] === "name" && nameRef.current) {
                    nameRef.current.focus();
                }
                if (error.path[0] === "email" && emailRef.current) {
                    emailRef.current.focus();
                }
                if (error.path[0] === "password" && passwordRef.current) {
                    passwordRef.current.focus();
                }
            });
            return;
        }

        createUser.mutate({
            name: result.data.name,
            email: result.data.email,
            password: result.data.password,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium">Name</label>
                <input
                    ref={nameRef}
                    type="text"
                    name="name"
                    required
                    className="mt-1 block w-full rounded-md border p-2"
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    required
                    className="mt-1 block w-full rounded-md border p-2"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <input
                    ref={passwordRef}
                    type="password"
                    name="password"
                    required
                    className="mt-1 block w-full rounded-md border p-2"
                />
            </div>
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white p-2 rounded-md disabled:opacity-50 flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                    </>
                ) : (
                    'Sign Up'
                )}
            </button>
        </form>
    );
}

async function LoginAction(
    formData: FormData,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    router: ReturnType<typeof useRouter>
) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res && !res.error) {
            router.push("/auth");
            return;
        }
        toast.error("Invalid credentials. Please check your email and password.");
    } catch (error: unknown) {
        console.error('Login error:', error);
        toast.error("An error occurred during login. Please try again.");
    } finally {
        setIsLoading(false);
    }
}