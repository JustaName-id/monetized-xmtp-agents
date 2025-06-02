'use client';

import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Inter } from 'next/font/google';
import { AppSidebar } from './sidebar';
import { useAccount } from 'wagmi';
import {useIdentity} from "@/hooks/xmtp";

interface LayoutProps {
  children: ReactNode;
}

const inter = Inter({ subsets: ['latin'] });

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected } = useAccount();
  useIdentity()
  return (
    <SidebarProvider>
      {isConnected && <AppSidebar />}
      <main className={`${inter.className} flex flex-col h-screen w-full`}>
        <Navbar />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
