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

export default function Navigation() {
    return (
        <NavigationMenu className="w-full p-3 font-sans font-semibold max-w-none">
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuLink>
                        <Link href="/">Home</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink>
                        <Link href="/private">Private</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink>
                        <Link href="/login">Log In</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Button>
                        <Link href="/login">Sign Up</Link>
                    </Button>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
