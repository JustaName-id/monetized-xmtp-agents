'use client'
import Connect from "@/components/Connect";
import { ModeToggle } from "@/components/ModeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAccount } from 'wagmi';

export const Navbar = () => {
    const account = useAccount();
    return (
        <div className="flex flex-row justify-between items-center px-5 py-2.5">
            {account.address ?
                <SidebarTrigger />
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