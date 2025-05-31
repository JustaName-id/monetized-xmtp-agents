import { Button } from "../ui"
import { useConnect } from 'wagmi';

export const ConnectWallet = () => {
    const { connectors, connect } = useConnect();
    return (
        <div className="flex flex-row p-4 justify-between rounded-sm bg-primary-foreground items-center">
            <div className="flex flex-col gap-2.5">
                <p className="text-muted-foreground font-normal text-xl leading-[100%]">Connect your Smart Wallet</p>
                <p className="text-muted-foreground font-normal text-base leading-[150%]">Leverage the power of Coinbase Smart Wallet to pay your agent</p>
            </div>
            <Button variant="default" onClick={() => connect({ connector: connectors[0] })}>Connect Wallet</Button>
        </div>
    )
}
