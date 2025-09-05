import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// TODO: better error messages for form validation failure (like password incorrect etc.)

export default function LoginPage() {
    return (
        <form className="font-sans flex flex-col gap-3 p-5 max-w-md m-auto mt-10" method="post">
            <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
            </div>
            <div className="flex gap-1">
                <Button className="cursor-pointer" formAction={login}>
                    Log in
                </Button>
                <Button className="cursor-pointer" formAction={signup}>
                    Sign up
                </Button>
            </div>
        </form>
    );
}
