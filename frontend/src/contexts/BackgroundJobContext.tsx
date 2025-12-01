import { createContext, useContext, useState, ReactNode } from "react"
import { JobStatus } from "@/components/BackgroundJobWidget"

interface BackgroundJobContextType {
  jobStatus: JobStatus
  jobProgress: number
  jobErrorMessage: string
  setJobStatus: (status: JobStatus) => void
  setJobProgress: (progress: number) => void
  setJobErrorMessage: (message: string) => void
  onViewResults: () => void
  setOnViewResults: (callback: () => void) => void
  dismissJob: () => void
}

const BackgroundJobContext = createContext<BackgroundJobContextType | undefined>(undefined)

export const BackgroundJobProvider = ({ children }: { children: ReactNode }) => {
  const [jobStatus, setJobStatus] = useState<JobStatus>("hidden")
  const [jobProgress, setJobProgress] = useState(0)
  const [jobErrorMessage, setJobErrorMessage] = useState("")
  const [viewResultsCallback, setViewResultsCallback] = useState<() => void>(() => () => {})

  const onViewResults = () => {
    viewResultsCallback()
    setJobStatus("hidden")
  }

  const setOnViewResults = (callback: () => void) => {
    setViewResultsCallback(() => callback)
  }

  const dismissJob = () => {
    setJobStatus("hidden")
    setJobErrorMessage("")
  }

  return (
    <BackgroundJobContext.Provider
      value={{
        jobStatus,
        jobProgress,
        jobErrorMessage,
        setJobStatus,
        setJobProgress,
        setJobErrorMessage,
        onViewResults,
        setOnViewResults,
        dismissJob,
      }}
    >
      {children}
    </BackgroundJobContext.Provider>
  )
}

export const useBackgroundJob = () => {
  const context = useContext(BackgroundJobContext)
  if (!context) {
    throw new Error("useBackgroundJob must be used within a BackgroundJobProvider")
  }
  return context
}
