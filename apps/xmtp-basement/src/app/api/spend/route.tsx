import { NextRequest, NextResponse } from "next/server";
import {spendPermissionManagerAbi, spendPermissionManagerAddress} from '@xmtpbasement/spend-permission';
import {getSpenderBundlerClient} from "@/lib/smartSpender";
import {db} from "@/db/drizzle";
import { spendEventsTable, spendPermissionsTable} from "@/db/schema";
import { SpendRequest} from "@/types";
import { v4 as uuid } from 'uuid';
import {Address} from "viem";
import {and, eq} from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spendRequest, signature }: {
      spendRequest:SpendRequest,
      signature: Address,
    } = body;


    console.log(body)
    const spendPermissionEntities = await db
      .select()
      .from(spendPermissionsTable)
      .where(
       and(
         eq(spendPermissionsTable.account, spendRequest.account.toLowerCase()),
         eq(spendPermissionsTable.spender, spendRequest.spender.toLowerCase()),
         eq(spendPermissionsTable.allowance, spendRequest.allowance.toString())
       ),
    )

    if(spendPermissionEntities.length ===0){
      return NextResponse.json({ message: "Subscription not found" }, { status: 400 });
    }
    const spendPermissionEntity = spendPermissionEntities[0]

    const { success, transactionHash } = await transactSmartWallet(
      spendRequest,
      signature
    );

    const permissionEventUUID = uuid();

    if(success){
      await db.insert(spendEventsTable).values({
        id: permissionEventUUID,
        permissionId: spendPermissionEntity.id,
        transactionHash: transactionHash,
        value: spendRequest.value.toString()
      })
    }

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

async function transactSmartWallet(spendRequest: SpendRequest, signature: Address) {
  const spenderBundlerClient = await getSpenderBundlerClient();

  console.log(spendRequest, signature)
  const userOpHash = await spenderBundlerClient.sendUserOperation({
    calls: [
      {
        abi: spendPermissionManagerAbi,
        functionName: "spendWithSignature",
        to: spendPermissionManagerAddress,
        args: [spendRequest, signature],
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
