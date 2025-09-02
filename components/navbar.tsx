import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import { Button } from "@/components/ui/button";

import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/login/actions";

export default async function Navigation() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    const currentUserEmail = data.user?.email;

    return (
        <NavigationMenu className="w-full p-3 font-sans font-semibold justify-between max-w-none">
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <Link href="/">Home</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <Link href="/private">Private</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
            {currentUserEmail ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="cursor-pointer">
                            Profile
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 font-sans">
                        <div className="px-2 py-1.5 text-sm font-mono text-muted-foreground text-center">
                            {currentUserEmail}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile/edit" className="cursor-pointer">
                                Edit Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="#">Upload Avatars</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="#">Your Chats</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <form action={logout}>
                                <button type="submit" className="w-full text-left cursor-pointer">
                                    Logout
                                </button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="cursor-pointer">
                            Log In
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 font-sans">
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/login">Existing Account</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/login">
                                <span className="font-semibold">Sign Up</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </NavigationMenu>
    );
}
