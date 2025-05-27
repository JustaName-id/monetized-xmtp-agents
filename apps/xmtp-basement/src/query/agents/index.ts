import {justanameInstance} from "@/utils/justaname";
import {clientEnv} from "@/utils/config/clientEnv";
import { useEnsSubnames } from '@justaname.id/react'

export const getAgents = () => {
  return justanameInstance().subnames.getSubnamesByEnsDomain({
    ensDomain: clientEnv.ensDomain,
  })
}

export const useAgents = () => {
  return useEnsSubnames({
    ensDomain: clientEnv.ensDomain,
    isClaimed: true
  })
}
