import {NewChat} from "@/components/newChat/NewChat";


export default async function Index({
                                searchParams,
                              }: {
  searchParams: Promise < {
    [key: string]: string | string[] | undefined
  } > ;
})  {
  const sp = await searchParams;
  const agentNameParam = sp.agent
  let agentName: string;
  if(!agentNameParam){
    return null // change it
  }

  if(Array.isArray(agentNameParam)){
    agentName = agentNameParam[0]
  }else{
    agentName = agentNameParam
  }

  return (
    <NewChat agentName={agentName} />
  )
}
