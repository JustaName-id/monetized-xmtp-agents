import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Inter } from 'next/font/google'
import { AppSidebar } from "./sidebar";

interface LayoutProps {
    children: ReactNode;
}

const inter = Inter({ subsets: ['latin'] })


const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className={`${inter.className} flex flex-col h-screen w-full`}>
                <Navbar />
                {children}
            </main>
        </SidebarProvider>
    )
}

export default Layout;