import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import {JustaName} from "@justaname.id/sdk";
import {serverEnv} from "@/utils/config/serverEnv";

interface SubnameRequest {
  username: string;
  address: string;
  signature: string;
  message: string;
  text: Record<string, string>;
  agent: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: SubnameRequest = await request.json();
    const { username, address, signature, message, agent } = body;

    if (!username) {
      return NextResponse.json({ message: "Username is required" }, { status: 400 });
    }
    if (!address || !signature || !message) {
      return NextResponse.json({ message: "Address, signature and message are required" }, { status: 400 });
    }

    const siweMessage = new SiweMessage(message);
    const chainId = siweMessage.chainId;

    if (!chainId) {
      return NextResponse.json({ message: "Invalid message" }, { status: 400 });
    }

    if (chainId !== 1 && chainId !== 11155111) {
      return NextResponse.json({ message: "Invalid chainId" }, { status: 400 });
    }

    const justaname = JustaName.init();

    const ensDomain = agent ? serverEnv.xmtpAgentEnsDomain : serverEnv.userEnsDomain;

    const revoke = await justaname.subnames.revokeSubname({
      username,
      ensDomain
    }, {
      xAddress: address,
      xMessage: message,
      xSignature: signature,
      xApiKey: agent ? serverEnv.xmtpAgentJustaNameApiKey : serverEnv.userJustaNameApiKey,
    });

    return NextResponse.json(revoke, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}
