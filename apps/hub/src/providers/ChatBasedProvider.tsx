import React, {useState} from "react";
import {ClaimDialog} from "@/components/ClaimDialog";

export interface ChatBasedContextType {
  handleOpenClaim: (open: boolean) => void;
}

export const ChatBasedContext = React.createContext<ChatBasedContextType>({
  // Default implementation that will be overridden by the provider
  handleOpenClaim: (open: boolean) => { /* intentionally empty */ }
})


export const ChatBasedProvider: React.FC<{children: React.ReactNode}> = ({
  children
                                                                         }) => {
  const [openClaim, setOpenClaim] = useState<boolean>(false)

  const handleOpenClaim = (open: boolean) => {
    if(open!==openClaim) setOpenClaim(open)
  }
  return (
    <ChatBasedContext.Provider value={{
      handleOpenClaim
    }}>
      {children}
      <ClaimDialog open={openClaim} onOpenChange={(open) => handleOpenClaim(open)} />
    </ChatBasedContext.Provider>
  )
}


export const useChatBased = () => {
  const context = React.useContext(ChatBasedContext)
  if(context === null) {
    throw new Error("useChatBased must be used within a ChatBasedProvider")
  }
  return context
}
