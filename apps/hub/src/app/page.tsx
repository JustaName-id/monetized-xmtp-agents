import Agents from '@/components/Agents';
export async function generateMetadata() {
  return {
    title: 'XMTP Agent Hub',
    description: 'Welcome to your XMTP agent hub!',
  };
}

export default async function Index() {
  return (
    <div>
      <div className="wrapper">
        <div className="chat-container">
          <div className="flex flex-col gap-6 h-full justify-center">
            <div className="flex flex-col gap-[14px]">
              <h1 className="text-3xl font-normal text-primary leading-[100%]">
                Welcome to the XMTP agent hub!
              </h1>
            </div>
            {/* Search Bar */}
            <Agents />
          </div>
        </div>
      </div>
    </div>
  );
}
