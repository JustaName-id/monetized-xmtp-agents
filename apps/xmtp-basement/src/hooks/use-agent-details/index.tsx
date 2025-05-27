import {useMemo} from "react";
import {SubnameResponse} from "@justaname.id/sdk";


export const useAgentDetails = (subname: SubnameResponse) => {
  const avatar = useMemo(() => {
    return subname.records.texts.find(text => text.key === "avatar")?.value || ""
  },[subname.records.texts])


  const description = useMemo(() => {
    return subname.records.texts.find(text => text.key === "description")?.value || ""
  },[subname.records.texts])

  const tags = useMemo(() => {
    return subname.records.texts.find(text => text.key === "xmtp_tags")?.value?.split(",") || []
  },[subname.records.texts])

  const fees = useMemo(() => {
    return subname.records.texts.find(text => text.key === "xmtp_fees")?.value || ""
  },[subname.records.texts])

  const spender = useMemo(() => {
    return subname.records.texts.find(text => text.key === "xmtp_spender")?.value || ""
  },[subname.records.texts])

  return {avatar, description, tags, fees, spender}
}
