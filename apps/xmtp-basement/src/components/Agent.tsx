
export interface AgentProps {
  subname: string;

}

export const Agent: React.FC<AgentProps> = ({subname}) => {

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {subname}
    </div>
  )
}
