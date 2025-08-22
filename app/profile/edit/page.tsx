import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/login/actions";

import { createClient } from "@/utils/supabase/server";

export default async function EditProfilePage() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    const currentUserEmail = data.user?.email; // Assuming password is available, which it typically isn't for security reasons

    return (
        <form className="font-sans flex flex-col gap-5 p-5 max-w-md m-auto mt-10" method="post">
            <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled value={currentUserEmail} />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required disabled value={".................."} />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="username">Username</Label>
                <p className="text-xs font-mono text-muted-foreground">/ same as email by default</p>
                <Input id="username" name="username" type="text" required />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="display-name">Display Name</Label>
                <Input id="display-name" name="display-name" type="text" />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="avatar">Avatar</Label>
                <p className="text-xs font-mono text-muted-foreground">/ upload your avatar image</p>
                <Input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    className="file:font-sans file:font-semibold file:text-md!important file:mr-3 file:text-black font-mono text-sm text-muted-foreground"
                />
            </div>
            <Button className="cursor-pointer" formAction={login} disabled>
                Update Profile
            </Button>
        </form>
    );
}
