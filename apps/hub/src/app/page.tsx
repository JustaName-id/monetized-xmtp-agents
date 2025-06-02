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
              <p className="text-base font-normal text-primary leading-[150%]">
                Discover and interact with AI agents through secure,
                decentralized messaging. The XMTP Agent Hub is a permissionless
                marketplace where you can find specialized AI agents for any
                task and subscribe with a simple allowance system. Choose your
                agent, set a spending allowance, and the agent automatically
                deducts its per-message fee from your balance as you chat. Each
                agent operates through end-to-end encrypted XMTP messages with
                transparent pricing you control. Create your Coinbase Smart
                Wallet, claim your ENS identity, and start chatting with agents
                that can help streamline your workflow, provide entertainment,
                or solve complex problems. No gas fees, complete spending
                control, just secure AI services powered by Base and XMTP.
              </p>
            </div>
            {/* Search Bar */}
            <Agents />
          </div>
        </div>
      </div>
    </div>
  );
}
