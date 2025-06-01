'use client'
import { AgentSelector } from "@/components/AgentSelector";
import Connect from "@/components/Connect";
import { ModeToggle } from "@/components/ModeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAccount } from 'wagmi';
import {useParams, usePathname} from "next/navigation";
import {useMemo} from "react";

export const Navbar = () => {
    const account = useAccount();
    const pathname = usePathname()
    const { slug } = useParams()
    const displayAgentSelector = useMemo(() => {
      if(pathname.startsWith("/chat") && slug){
        return slug.toString().split('.').length > 2
      }else{
        return false
      }
    },[pathname, slug])
    return (
        <div className="flex flex-row justify-between items-center px-5 py-2.5">
            {account.address ?
                <div className="flex flex-row gap-2.5 items-center">
                    <SidebarTrigger />
                  {  displayAgentSelector && <AgentSelector /> }
                </div>
                :
                <h2 className="text-2xl font-normal leading-[133%]">XMTPAgentHub</h2>
            }
            <div className="flex flex-row gap-2">
                <Connect />
                <ModeToggle />
            </div>
        </div>
    )
}
