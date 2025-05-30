import { NextRequest, NextResponse } from "next/server";
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
  SubscriptionsResponse
} from '@xmtpbasement/spend-permission';
import {publicClient} from "@/lib/smartSpender";
import {db} from "@/db/drizzle";
import {spendPermissionsTable} from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {justanameInstance} from "@/utils/justaname";
import {serverEnv} from "@/utils/config/serverEnv";
import { parseUnits} from "viem";

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


    const validationResults = results.map((result, index) => ({
      spendPermission: spendPermissions[index],
      isValid: result.status === 'success' ? Boolean(result.result) : false,
      error: result.status === 'failure' ? result.error : null,
    }));

    let extraCheck = await Promise.all(
      validationResults.map(async (result) => {

        if (!result.isValid || result.error) {
          return result;
        }
        const spenderAddress = result.spendPermission.spender
        const subnames = await justanameInstance().subnames.getSubnamesByAddress({
          address: spenderAddress
        })

        const subname = subnames.subnames.find(subname => subname.ens.endsWith(serverEnv.xmtpAgentEnsDomain))

        if (subname) {

          const xmtpFees = subname.records.texts.find(record => record.key === 'xmtp_fees')

          if (xmtpFees && result.spendPermission.allowance === parseUnits(xmtpFees.value, 6).toString()) {
            return {
              ...result,
              isValid: true
            }
          }
        }

        return {
          ...result,
          isValid: false
        }
      })
    )

    if(isValid==="true"){
      extraCheck = extraCheck.filter(({isValid}) => isValid)
    }

    if(isValid==="false"){
      extraCheck = extraCheck.filter(({isValid}) => !isValid)
    }


    const response: SubscriptionsResponse = {
      subscriptions: extraCheck
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({}, { status: 500 });
  }
}
