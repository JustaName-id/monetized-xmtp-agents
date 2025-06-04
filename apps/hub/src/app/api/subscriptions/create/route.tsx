import { NextRequest, NextResponse } from 'next/server';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from '@agenthub/spend-permission';
import { getSpenderBundlerClient } from '@/lib/smartSpender';
import { db } from '@/db/drizzle';
import { approvalEventsTable, spendPermissionsTable } from '@/db/schema';
import { SpendPermission } from '@/types';
import { v4 as uuid } from 'uuid';
import { Address } from 'viem';
import { clientEnv } from '@/utils/config/clientEnv';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      spendPermission,
      signature,
    }: {
      spendPermission: SpendPermission;
      signature: Address;
    } = body;

    const { success, transactionHash } = await transactSmartWallet(
      spendPermission,
      signature
    );

    const spendPermissionUUID = uuid();

    await db.insert(spendPermissionsTable).values({
      ...spendPermission,
      account: spendPermission.account.toLowerCase(),
      spender: spendPermission.spender.toLowerCase(),
      id: spendPermissionUUID,
      start: new Date(spendPermission.start * 1000),
      salt: spendPermission.salt.toString(),
      end: new Date(spendPermission.end * 1000),
      allowance: spendPermission.allowance.toString(),
    });

    const approvalEventUUID = uuid();

    await db.insert(approvalEventsTable).values({
      id: approvalEventUUID,
      permissionId: spendPermissionUUID,
      transactionHash: transactionHash,
    });

    return NextResponse.json({
      status: success ? 'success' : 'failure',
      transactionHash: transactionHash,
      transactionUrl: `${clientEnv.baseNetwork.blockExplorers?.default.url}/tx/${transactionHash}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({}, { status: 500 });
  }
}

async function transactSmartWallet(
  spendPermission: SpendPermission,
  signature: Address
) {
  const spenderBundlerClient = await getSpenderBundlerClient();

  const userOpHash = await spenderBundlerClient.sendUserOperation({
    calls: [
      {
        abi: spendPermissionManagerAbi,
        functionName: 'approveWithSignature',
        to: spendPermissionManagerAddress,
        args: [spendPermission, signature],
      },
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
