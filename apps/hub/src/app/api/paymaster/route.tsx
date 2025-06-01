// import { paymasterClient, getSpenderBundlerClient} from "@/lib/smartSpender";
import {serverEnv} from "@/utils/config/serverEnv";
import axios from "axios";

export async function POST(r: Request) {
  try {
    const req = await r.json();
    const method = req.method;
    // const [userOp, entryPointAddress, chainId] = req.params;

    //
    // console.log('=== PAYMASTER REQUEST ===');
    // console.log('Method:', method);
    // console.log('Params:', req.params);
    // const spenderBundler = await getSpenderBundlerClient()
    // if(method==="eth_sendUserOperation") {
    //   const result = await spenderBundler.sendUserOperation({
    //     callData: userOp.callData,
    //     entryPointAddress: entryPointAddress,
    //     nonce: userOp.nonce,
    //     sender: userOp.sender,
    //     maxFeePerGas: userOp.maxFeePerGas,
    //     maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
    //     callGasLimit: userOp.callGasLimit,
    //     verificationGasLimit: userOp.verificationGasLimit,
    //     preVerificationGas: userOp.preVerificationGas,
    //     signature: userOp.signature,
    //     paymasterAndData: userOp.paymasterAndData,
    //   })
    //
    //   console.log('✅ Send User Op:', result);
    //   return Response.json({ result });
    //
    // }
    //
    // if(method === 'eth_getUserOperationReceipt'){
    //   const result = await spenderBundler.waitForUserOperationReceipt({
    //     hash: userOp,
    //   })
    //
    //
    //   return Response.json({ result });
    // }
    //
    // if(method === 'eth_estimateUserOperationGas'){
    //
    //   const result = await spenderBundler.request({
    //     method: 'eth_estimateUserOperationGas',
    //     params: [
    //       {
    //         sender: userOp.sender,
    //         nonce: userOp.nonce,
    //         callData: userOp.callData,
    //         callGasLimit: userOp.callGasLimit,
    //         verificationGasLimit: userOp.verificationGasLimit,
    //         preVerificationGas: userOp.preVerificationGas,
    //         maxFeePerGas: userOp.maxFeePerGas,
    //         maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
    //         signature: userOp.signature || '0x',
    //         initCode: userOp.initCode || '0x',
    //         paymasterAndData: '0x'
    //       },
    //       entryPointAddress
    //     ]
    //   });
    //   console.log('✅ Gas Estimated stub result:', result);
    //
    //   return Response.json({ result });
    // }
    //
    // if (method === "pm_getPaymasterStubData") {
    //   const result = await paymasterClient.getPaymasterStubData({
    //     callData: userOp.callData,
    //     chainId: chainId,
    //     entryPointAddress: entryPointAddress,
    //     nonce: userOp.nonce,
    //     sender: userOp.sender,
    //     maxFeePerGas: userOp.maxFeePerGas,
    //     maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
    //     callGasLimit: userOp.callGasLimit,
    //     verificationGasLimit: userOp.verificationGasLimit,
    //     preVerificationGas: userOp.preVerificationGas,
    //   });
    //
    //   console.log('✅ Paymaster stub result:', result);
    //   return Response.json({ result });
    //
    // }
    //
    // if (method === "pm_getPaymasterData") {
    //   const result = await paymasterClient.getPaymasterData({
    //     callData: userOp.callData,
    //     chainId: chainId,
    //     entryPointAddress: entryPointAddress,
    //     nonce: userOp.nonce,
    //     sender: userOp.sender,
    //     maxFeePerGas: userOp.maxFeePerGas,
    //     maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
    //     callGasLimit: userOp.callGasLimit,
    //     verificationGasLimit: userOp.verificationGasLimit,
    //     preVerificationGas: userOp.preVerificationGas,
    //   });
    //
    //   console.log('✅ Paymaster data result:', result);
    //   return Response.json({ result });
    // }

    const result = await axios.post(serverEnv.basePaymasterUrl, {
      method,
      params: req.params,
      jsonrpc: '2.0',
      id:1
    })
    return Response.json(result.data);
  } catch (error) {
    console.error('=== PAYMASTER ERROR ===');
    console.error('Error:', error);

    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
