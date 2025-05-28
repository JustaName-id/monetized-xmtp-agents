import { NextRequest, NextResponse } from "next/server";
import {spendPermissionManagerAbi, spendPermissionManagerAddress} from '@xmtpbasement/spend-permission';
import {getSpenderBundlerClient} from "@/lib/smartSpender";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spendPermission, signature } = body;

    const { success, transactionHash } = await transactSmartWallet(
      spendPermission,
      signature
    );

    return NextResponse.json({
      status: success ? "success" : "failure",
      transactionHash: transactionHash,
      transactionUrl: `https://sepolia.basescan.org/tx/${transactionHash}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({}, { status: 500 });
  }
}

async function transactSmartWallet(spendPermission: any, signature: any) {
  const spenderBundlerClient = await getSpenderBundlerClient();

  const userOpHash = await spenderBundlerClient.sendUserOperation({
    calls: [
      {
        abi: spendPermissionManagerAbi,
        functionName: "approveWithSignature",
        to: spendPermissionManagerAddress,
        args: [spendPermission, signature],
      }
    ],
  });

  const userOpReceipt = await spenderBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  return {
    success: userOpReceipt.success,
    transactionHash: userOpReceipt.receipt.transactionHash,
  };
}
