"use client";

import { login, signup } from "./actions";
import { useState } from "react";

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
    AlertDialogAction,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";

import { InfoIcon } from "lucide-react";

// TODO: better error messages for form validation failure (like password incorrect etc.)
// TODO: show message that confirmation is needed to sign in after sign up.

export default function LoginPage() {
    const [success, setSuccess] = useState(true);
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
                                To use your account you first have to confirm it. Please check your email (and spam
                                folder) for the confirmation instructions and then come back.
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
            <Tabs defaultValue="login">
                <TabsList>
                    <TabsTrigger value="login" className="cursor-pointer">
                        Log In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="cursor-pointer">
                        Sign Up
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log In</CardTitle>
                            <CardDescription className="font-mono text-xs">
                                Log in to your existing account here. If you don&apos;t have an account, click on
                                &quot;Sign Up&quot; instead.
                            </CardDescription>
                        </CardHeader>
                        <form className="flex flex-col gap-6 w-full m-auto" method="post">
                            <CardContent className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="cursor-pointer" formAction={login}>
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
                            <CardDescription className="font-mono text-xs">
                                Create an account to start chatting! If you already have an account, click on &quot;Log
                                In&quot; instead.
                            </CardDescription>
                        </CardHeader>
                        <form className="flex flex-col gap-6 w-full m-auto" method="post">
                            <CardContent className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="cursor-pointer" formAction={signup}>
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
