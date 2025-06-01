'use client'
import {useAccount} from "wagmi";
import {useSubscription} from "@/query/subscription";
import {useMemo} from "react";
import {redirect} from "next/navigation";
import {useAddressSubnames} from "@justaname.id/react";
import {clientEnv} from "@/utils/config/clientEnv";

export default function Index() {
  const { isConnected, isConnecting} = useAccount()
  const { validSubscriptions } = useSubscription()
  const firstSubscription = useMemo(() => {
    return validSubscriptions?.[0]
  },[validSubscriptions])
  const agentAddress = useMemo(()=> {
    return firstSubscription?.spendPermission?.spender
  },[firstSubscription])
  const { addressSubnames} = useAddressSubnames({
    address: agentAddress,
    chainId:1
  });
  const agentSubname = useMemo(()=>
    addressSubnames.find(({ens})=>ens.endsWith(clientEnv.xmtpAgentEnsDomain))
    ,[addressSubnames])

  if(agentSubname){
    redirect('/chat/'+agentSubname.ens)
  }

  if(validSubscriptions && validSubscriptions.length ===0){
    redirect('/')
  }

  if(!isConnected && !isConnecting){
    redirect('/')
  }

  return null
}
