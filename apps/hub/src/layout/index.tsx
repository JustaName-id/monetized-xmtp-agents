'use client';

import { ReactNode, useEffect } from 'react';
import { Navbar } from './navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Inter } from 'next/font/google';
import { AppSidebar } from './sidebar';
import { useAccount } from 'wagmi';
import { useIdentity } from "../query/xmtp";
import { usePathname, useRouter } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
}

const inter = Inter({ subsets: ['latin'] });

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected, isConnecting } = useAccount();
  const pathname = usePathname();
  const router = useRouter();
  useIdentity()

  const CheckAccountStatus = () => {
    if (!isConnected && !isConnecting && pathname !== '/') {
      router.push('/');
    }
  }

  useEffect(() => {
    CheckAccountStatus();
  }, [isConnected, isConnecting, pathname]);


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
