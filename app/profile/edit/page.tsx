import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/login/actions";

export default function EditProfilePage() {
    return (
        <form className="font-sans flex flex-col gap-5 p-5 max-w-md m-auto mt-10" method="post">
            <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" type="text" required />
                <p className="text-xs font-mono text-muted-foreground">/ same as email by default</p>
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="display-name">Display Name</Label>
                <Input id="display-name" name="display-name" type="text" />
            </div>
            <Button className="cursor-pointer" formAction={login} disabled>
                Update Profile
            </Button>
        </form>
    );
}
