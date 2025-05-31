import {justanameInstance} from "@/utils/justaname";
import {clientEnv} from "@/utils/config/clientEnv";
import { useEnsSubnames, useSubname } from '@justaname.id/react'

export const getAgents = () => {
  return justanameInstance().subnames.getSubnamesByEnsDomain({
    ensDomain: clientEnv.xmtpAgentEnsDomain,
  })
}

export const useAgents = () => {
  return useEnsSubnames({
    ensDomain: clientEnv.xmtpAgentEnsDomain,
    isClaimed: true
  })
}


export const useAgent = (name: string | undefined) => {
  const { subname } = useSubname({
    subname: name,
    chainId: 1,
    enabled: !!name && name !== '',
  })

  return {
    subname
  }
}
