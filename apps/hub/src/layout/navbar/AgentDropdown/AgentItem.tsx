'use client'
import { useAgentDetails } from "@/hooks/use-agent-details";
import { clientEnv } from "@/utils/config/clientEnv";
import { useAddressSubnames } from "@justaname.id/react";
import { Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Avatar, AvatarImage } from "../../../components/ui";
export interface AgentItemProps {
    address: string;
    selected?: boolean;
    small?: boolean;
    className?: string;
}

export const AgentItem: React.FC<AgentItemProps> = ({ address, selected, small, className }) => {
    const router = useRouter()
    const pathname = usePathname();
    const { addressSubnames } = useAddressSubnames({
        address,
        chainId: 1
    })
    const agentSubname = useMemo(() => {
        return addressSubnames.find(({ ens }) => ens.endsWith(clientEnv.xmtpAgentEnsDomain))
    }, [addressSubnames])
    const {
        avatar,
    } = useAgentDetails(
        agentSubname
    )
    const onClick = () => {
        if (agentSubname?.ens && pathname.includes(agentSubname.ens)) {
            return
        } else {
            router.push(`/chat/${agentSubname?.ens}`)
        }
    }

    return (
        <div className={`flex flex-row items-center gap-2 ${small ? "py-1 px-0" : "py-2 px-2.5"} cursor-pointer w-full ${className}`} onClick={onClick}>
            <Avatar className="w-6 h-6 rounded-full">
                <AvatarImage src={avatar} />
            </Avatar>
            {!small && (
                <p className="text-xs font-semibold text-base-sidebar-foreground my-auto leading-[100%]">{agentSubname?.ens}</p>
            )}
            {selected && <Check className="w-4 h-4 ml-auto" />}
        </div>
    )
}
