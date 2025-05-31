import { Chat } from "@/components/chat/Chat";

export default async function Index({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params

    if (!id) {
        return null;
    }

    return <Chat conversationId={id} />;
}
