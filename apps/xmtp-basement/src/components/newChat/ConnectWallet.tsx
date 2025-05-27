import { Button } from "../ui"
import { useConnect } from 'wagmi';

export const ConnectWallet = () => {
    const { connectors, connect } = useConnect();
    return (
        <div className="flex flex-row p-4 gap-2.5 rounded-sm bg-primary-foreground items-center">
            <div className="flex flex-col gap-2.5">
                <p className="text-muted font-normal text-xl leading-[100%]">Connect your Wallet</p>
                <p className="text-muted font-normal text-base leading-[150%]">Lorem ipsum dolor sit amet consectetur. Nisi nisl at volutpat maecenas ornare feugiat pharetra. Sed odio tellus maecenas porta elementum. </p>
            </div>
            <Button variant="default" onClick={() => connect({ connector: connectors[0] })}>Connect Wallet</Button>
        </div>
    )
}
