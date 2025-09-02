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

import Link from "next/link";
import { Button } from "@/components/ui/button";

import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/login/actions";

export default async function Navigation() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    const currentUserEmail = data.user?.email;

    // TODO: replace right side of nevigation menu with dropdown menu

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
            <NavigationMenuList>
                {currentUserEmail ? (
                    <>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Profile</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[220px] gap-4 mr-auto">
                                    <li>
                                        <div>
                                            <p className="my-2 text-sm font-mono text-muted-foreground text-center">
                                                {currentUserEmail}
                                            </p>
                                        </div>
                                        <NavigationMenuLink asChild>
                                            <Link href="/profile/edit">Edit Profile</Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="#">Upload Avatars</Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="#">Your Chats</Link>
                                        </NavigationMenuLink>
                                    </li>
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <form action={logout}>
                                <Button className="cursor-pointer" type="submit">
                                    Logout
                                </Button>
                            </form>
                        </NavigationMenuItem>
                    </>
                ) : (
                    <>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link href="/login">Log In</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Button>
                                <Link href="/login">Sign Up</Link>
                            </Button>
                        </NavigationMenuItem>
                    </>
                )}
            </NavigationMenuList>
        </NavigationMenu>
    );
}
