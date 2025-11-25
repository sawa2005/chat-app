"use client";

import { login, signup } from "./actions";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";

import { InfoIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

function isValidEmail(email: string) {
    const re =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

export default function LoginPage() {
    const params = useSearchParams();
    const tab: "signup" | "login" = params.get("tab") === "signup" ? "signup" : "login";

    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState<string | undefined>();
    const [selectedTab, setSelectedTab] = useState(tab);

    useEffect(() => {
        setSelectedTab(tab);
    }, [params, tab]);

    useEffect(() => {
        if (!emailInput) return setError("");

        setError(isValidEmail(emailInput) ? "" : "Please enter a valid email.");
    }, [emailInput]);

    useEffect(() => {
        if (!password || !confirmPass) return setError("");

        if (password !== confirmPass) return setError("Password and confirm password has to match.");
        if (password.length < 6) return setError("Password must have at least 6 characters.");

        setError(null);
    }, [password, confirmPass]);

    async function handleLogin(formData: FormData) {
        const response = await login(formData);

        if (response) {
            setError(response.message);
        }
    }

    async function handleSignup(formData: FormData) {
        const result = await signup(formData);

        // Open the alert only if confirmation is required
        if (result?.confirmationNeeded) {
            setConfirmEmail(result.email);
            setSuccess(true);
        }
    }
    return (
        <div className="font-sans flex w-full max-w-md flex-col gap-6 mt-[15vh] m-auto">
            {success && (
                <AlertDialog open={success}>
                    <AlertDialogContent className="font-sans">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex gap-2">
                                <InfoIcon /> Confirmation needed
                            </AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-xs">
                                To use your account you first have to confirm it. Please check your email:
                                <span className="text-foreground"> {confirmEmail}</span> (and spam folder) for the
                                confirmation instructions and then you can close this tab.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSuccess(false)} className="cursor-pointer">
                                Got It
                            </AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Tabs defaultValue={tab} value={selectedTab}>
                <TabsList>
                    <TabsTrigger value="login" onClick={() => setSelectedTab("login")} className="cursor-pointer">
                        Log In
                    </TabsTrigger>
                    <TabsTrigger value="signup" onClick={() => setSelectedTab("signup")} className="cursor-pointer">
                        Sign Up
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log In</CardTitle>
                            {error ? (
                                <div className="text-destructive font-mono text-xs">{error}</div>
                            ) : (
                                <CardDescription className="font-mono text-xs">
                                    Log in to your existing account here. If you don&apos;t have an account, click on
                                    &quot;Sign Up&quot; instead.
                                </CardDescription>
                            )}
                        </CardHeader>
                        <form className="flex flex-col gap-6 w-full m-auto" method="post">
                            <CardContent className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        onChange={() => setError(null)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        onChange={() => setError(null)}
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="cursor-pointer" formAction={handleLogin}>
                                    Log In
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
                <TabsContent value="signup">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign Up</CardTitle>
                            {error ? (
                                <div className="text-destructive font-mono text-xs">{error}</div>
                            ) : (
                                <CardDescription className="font-mono text-xs">
                                    Create an account to start chatting! If you already have an account, click on
                                    &quot;Log In&quot; instead.
                                </CardDescription>
                            )}
                        </CardHeader>
                        <form className="flex flex-col gap-6 w-full m-auto mb-10" method="post">
                            <CardContent className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="password">Confirm Password</Label>
                                    <Input
                                        id="confirm"
                                        name="confirm"
                                        type="password"
                                        value={confirmPass}
                                        onChange={(e) => setConfirmPass(e.target.value)}
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="cursor-pointer" formAction={handleSignup} disabled={error !== null}>
                                    Sign Up
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
