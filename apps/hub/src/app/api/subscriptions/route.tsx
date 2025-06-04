import { NextRequest, NextResponse } from "next/server";
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
  SubscriptionsResponse
} from '@agenthub/spend-permission';
import {publicClient} from "@/lib/smartSpender";
import {db} from "@/db/drizzle";
import {spendPermissionsTable} from "@/db/schema";
import {and, eq} from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const account = request?.nextUrl?.searchParams.get('account')
    const spender = request?.nextUrl?.searchParams.get('spender')
    const fees = request?.nextUrl?.searchParams.get('fees')
    const isValid = request?.nextUrl?.searchParams.get('isValid')


    const spendPermissions = await db
      .select()
      .from(spendPermissionsTable)
      .where(
        account || spender || fees
          ? and(
              account ? eq(spendPermissionsTable.account, account.toLowerCase()) : undefined,
              spender ? eq(spendPermissionsTable.spender, spender.toLowerCase()) : undefined,
              fees ? eq(spendPermissionsTable.allowance, fees) : undefined
            )
          : undefined
      );

    const results = await publicClient.multicall({
      contracts: spendPermissions.map((spendPermission) => {
        return {
          abi: spendPermissionManagerAbi,
          functionName: "isValid",
          address: spendPermissionManagerAddress,
          args: [{
            account: spendPermission.account,
            spender: spendPermission.spender,
            token: spendPermission.token,
            allowance: spendPermission.allowance,
            period: spendPermission.period,
            start: Math.floor((new Date(spendPermission.start)).getTime() / 1000) ,
            end: Math.floor((new Date(spendPermission.end)).getTime() / 1000),
            salt: spendPermission.salt,
            extraData: spendPermission.extraData,
          }],
        }
      })
    })


    let validationResults = results.map((result, index) => ({
      spendPermission: spendPermissions[index],
      isValid: result.status === 'success' ? Boolean(result.result) : false,
      error: result.status === 'failure' ? result.error : null,
    }));

    if(isValid==="true"){
      validationResults = validationResults.filter(({isValid}) => isValid)
    }

    if(isValid==="false"){
      validationResults = validationResults.filter(({isValid}) => !isValid)
    }


    const response: SubscriptionsResponse = {
      subscriptions: validationResults
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({}, { status: 500 });
  }
}
