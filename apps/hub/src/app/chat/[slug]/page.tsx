'use client'

import { Chat } from "@/components/chat/Chat";
import {useParams} from "next/navigation";
import {useMemo} from "react";

export default function Index() {
    const { slug } = useParams();
    const [conversationId, agentName] = useMemo(()=> {
      return slug ? slug?.toString()?.split('.').length > 2 ?[undefined,slug as string] : [slug as string, undefined] : [undefined, undefined]
    }, [slug])

    if (!conversationId && !agentName) {
        return null
    }



    return <Chat conversationId={conversationId} agentName={agentName} />;
}
