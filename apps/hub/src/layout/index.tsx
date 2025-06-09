'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { Inter } from 'next/font/google';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useIdentity } from "../query/xmtp";
import { Navbar } from './navbar';
import { AppSidebar } from './sidebar';

interface LayoutProps {
  children: ReactNode;
}

const inter = Inter({ subsets: ['latin'] });

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected, isConnecting } = useAccount();
  const pathname = usePathname();
  const router = useRouter();
  const { slug } = useParams();
  const isConversationId = useMemo(() => {
    return slug ? slug?.toString()?.split('.').length > 2 ? false : true : false
  }, [slug])

  const isSpecificChat = useMemo(() => {
    return isConversationId && pathname.includes('/chat')
  }, [isConversationId])

  useIdentity()

  const CheckAccountStatus = () => {
    if (!isConnected && !isConnecting && isSpecificChat) {
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
