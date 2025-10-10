import PrivatePage from "@/app/private/page";
import { CreateConversationForm } from "@/components/create-conversation-form";

export default async function CreateConversationPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; users?: string }>;
}) {
    await PrivatePage();

    const params = await searchParams;

    // read errors from searchParams and render a small banner in the page
    const errorKey = params.error ?? null;
    const missingUsers = params.users ? decodeURIComponent(params.users).split(",") : [];

    return (
        <div className="font-sans flex flex-col justify-center m-auto w-fit mt-20">
            <h1 className="text-2xl font-bold">Create a New Conversation</h1>
            <CreateConversationForm errorKey={errorKey} missingUsers={missingUsers} />
        </div>
    );
}
