

import Agents from '@/components/Agents';
import { getAgents } from "@/query/agents";

// This function runs on the server during SSR
export async function generateMetadata() {
  // You can use this to set dynamic metadata based on fetched data
  return {
    title: 'Data Dashboard',
    description: 'Server-side rendered data with client-side updates',
  };
}

// Server Component for initial data fetching
export default async function Index() {
  // Fetch initial data on the server
  const initialData = await getAgents();


  return (
    <div>
      <div className="wrapper">
        <div className="container">
          <div className='flex flex-col gap-6 h-full justify-center'>
            <div className='flex flex-col gap-[14px]'>
              <h1 className='text-3xl font-normal text-primary leading-[100%]'>Welcome to your Web3 agent hub!</h1>
              <p className='text-base font-normal text-primary leading-[150%]'>Lorem ipsum dolor sit amet consectetur. Nisi nisl at volutpat maecenas ornare feugiat pharetra. Sed odio tellus maecenas porta elementum. Convallis varius facilisi tincidunt scelerisque. Nibh ac neque aliquet tempus felis tempus at.</p>
            </div>
            {/* Search Bar */}
            <Agents initialData={initialData} />
          </div>
        </div>
      </div>
    </div>
  );
}
