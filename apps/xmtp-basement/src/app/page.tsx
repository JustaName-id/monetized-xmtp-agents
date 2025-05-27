import Agents from '@/components/Agents';
import { getAgents } from "@/query/agents";

export async function generateMetadata() {
  return {
    title: 'XMTP Agent Hub',
    description: 'Welcome to your XMTP agent hub!',
  };
}

export default async function Index() {
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
