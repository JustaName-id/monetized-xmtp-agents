import { useXMTP } from "@/context/XMTPContext";
import { useLocalVariables } from "@/hooks/use-local";
import { createSCWSigner } from "@/utils/helpers/createSigner";
import { hexToUint8Array } from "uint8array-extras";
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi';
import { baseSepolia, mainnet } from "wagmi/chains";
import { Button } from "../ui";

export const ConnectXmtp = () => {
    const account = useAccount();
    const { initialize } = useXMTP();
    const { signMessageAsync } = useSignMessage();
    const { switchChainAsync } = useSwitchChain();

    const {
        encryptionKey,
    } = useLocalVariables();


    const handleConnect = async () => {
        if (!account.address) {
            return;
        }
        await switchChainAsync({ chainId: mainnet.id });
        await initialize({
            dbEncryptionKey: encryptionKey
                ? hexToUint8Array(encryptionKey)
                : undefined,
            env: "dev",
          loggingLevel:'off',
            // loggingLevel: "debug",
            signer: createSCWSigner(account.address, (message: string) =>
                signMessageAsync({ message }),
            ),
        });
        await switchChainAsync({ chainId: baseSepolia.id });
    }

    return (
        <div className="flex flex-row p-4 gap-2.5 rounded-sm bg-primary-foreground items-center">
            <div className="flex flex-col gap-2.5">
                <p className="text-muted-foreground font-normal text-xl leading-[100%]">Connect to XMTP</p>
                <p className="text-muted-foreground font-normal text-base leading-[150%]">Lorem ipsum dolor sit amet consectetur. Nisi nisl at volutpat maecenas ornare feugiat pharetra. Sed odio tellus maecenas porta elementum. </p>
            </div>
            <Button variant="default" onClick={handleConnect}>Connect To XMTP</Button>
        </div>
    )
}
