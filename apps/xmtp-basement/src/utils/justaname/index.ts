import {JustaName} from "@justaname.id/sdk";
import {clientEnv} from "@/utils/config/clientEnv";

export const justanameInstance = () => {
  return JustaName.init({
    ensDomains: [
      {
        ensDomain: clientEnv.ensDomain,
        chainId: 1
      }
    ]
  })
}
