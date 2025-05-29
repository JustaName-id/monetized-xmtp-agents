import { Chat } from "@/components/chat/Chat";

export default async function Index({
    params,
}: {
    params: { id: string };
}) {
    const conversationId = params.id;

    if (!conversationId) {
        return null;
    }

    return <Chat conversationId={conversationId} />;
}
