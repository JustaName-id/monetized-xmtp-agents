import {paymasterClient, publicClient} from "@/lib/smartSpender";
import { UserOperation } from "viem/account-abstraction";
import { entryPoint06Address } from "viem/account-abstraction";
import {
  Address,
  BlockTag,
  Hex,
  decodeAbiParameters,
  decodeFunctionData,
} from "viem";
import { baseSepolia } from "viem/chains";
import {
  coinbaseSmartWalletAbi,
  coinbaseSmartWalletProxyBytecode,
  coinbaseSmartWalletV1Implementation,
  erc1967ProxyImplementationSlot,
} from "@/lib/abi/CoinbaseSmartWallet";

export async function POST(r: Request) {
  const req = await r.json();
  const method = req.method;
  const [userOp, entrypoint, chainId] = req.params;

  const sponsorable = await willSponsor({
    chainId: parseInt(chainId),
    entrypoint,
    userOp,
  });
  if (!sponsorable) {
    return Response.json({ error: "Not a sponsorable operation" });
  }

  if (method === "pm_getPaymasterStubData") {
    const result = await paymasterClient.getPaymasterStubData({
      callData: userOp.callData,
      chainId: chainId,
      entryPointAddress: entrypoint,
      nonce: userOp.nonce,
      sender: userOp.sender,
    });
    return Response.json({ result });
  } else if (method === "pm_getPaymasterData") {
    const result = await paymasterClient.getPaymasterData({
      callData: userOp.callData,
      chainId: chainId,
      entryPointAddress: entrypoint,
      nonce: userOp.nonce,
      sender: userOp.sender,
    });
    return Response.json({ result });
  }
  return Response.json({ error: "Method not found" });
}

export async function willSponsor({
                                    chainId,
                                    entrypoint,
                                    userOp,
                                  }: { chainId: number; entrypoint: string; userOp: UserOperation<'0.6'> }) {
  // check chain id
  if (chainId !== baseSepolia.id) return false;
  // check entrypoint
  // not strictly needed given below check on implementation address, but leaving as example
  if (entrypoint.toLowerCase() !== entryPoint06Address.toLowerCase())
    return false;

  try {
    // check the userOp.sender is a proxy with the expected bytecode
    const code = await publicClient.getBytecode({ address: userOp.sender });
    if (code != coinbaseSmartWalletProxyBytecode) return false;

    // check that userOp.sender proxies to expected implementation
    const implementation = await publicClient.request<{
      Parameters: [Address, Hex, BlockTag];
      ReturnType: Hex;
    }>({
      method: "eth_getStorageAt",
      params: [userOp.sender, erc1967ProxyImplementationSlot, "latest"],
    });
    const implementationAddress = decodeAbiParameters(
      [{ type: "address" }],
      implementation,
    )[0];
    if (implementationAddress != coinbaseSmartWalletV1Implementation)
      return false;

    // check that userOp.callData is making a call we want to sponsor
    const calldata = decodeFunctionData({
      abi: coinbaseSmartWalletAbi,
      data: userOp.callData,
    });

    // keys.coinbase.com always uses executeBatch
    if (calldata.functionName !== "executeBatch") return false;
    if (!calldata.args || calldata.args.length == 0) return false;

    const calls = calldata.args[0] as {
      target: Address;
      value: bigint;
      data: Hex;
    }[];
    // modify if want to allow batch calls to your contract
    if (calls.length > 2) return false;

    return true;
  } catch (e) {
    console.error(`willSponsor check failed: ${e}`);
    return false;
  }
  }
