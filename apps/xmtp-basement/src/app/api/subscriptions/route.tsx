import { NextRequest, NextResponse } from "next/server";
import {spendPermissionManagerAbi, spendPermissionManagerAddress} from '@xmtpbasement/spend-permission';
import {publicClient} from "@/lib/smartSpender";
import {db} from "@/db/drizzle";
import {spendPermissionsTable} from "@/db/schema";
import {eq} from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const address = request?.nextUrl?.searchParams.get('address')

    if(!address){
      return NextResponse.json({ message: "Address is required" }, { status: 400 });
    }

    const spendPermissions = await db.select().from(spendPermissionsTable).where(
      eq(spendPermissionsTable.account, address)
    )

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
            start: spendPermission.start,
            end: spendPermission.end,
            salt: spendPermission.salt,
            extraData: spendPermission.extraData,
          }],
        }
      })
    })

    console.log(results)
    const validationResults = results.map((result, index) => ({
      spendPermission: spendPermissions[index],
      isValid: result.status === 'success' ? result.result : false,
      error: result.status === 'failure' ? result.error : null,
    }));

    console.log(validationResults)

    return NextResponse.json(validationResults);
  } catch (error) {
    console.error(error);
    return NextResponse.json({}, { status: 500 });
  }
}
