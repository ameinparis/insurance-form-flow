import { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { JobStatus } from "@/components/BackgroundJobWidget"

export interface BackgroundJob {
  id: string
  status: JobStatus
  progress: number
  errorMessage: string
  label: string
  onViewResults?: () => void
}

interface BackgroundJobContextType {
  jobs: BackgroundJob[]
  addJob: (label?: string) => string
  updateJob: (id: string, updates: Partial<Omit<BackgroundJob, 'id'>>) => void
  removeJob: (id: string) => void
  getJob: (id: string) => BackgroundJob | undefined
  setJobViewResultsCallback: (id: string, callback: () => void) => void
}

const BackgroundJobContext = createContext<BackgroundJobContextType | undefined>(undefined)

let jobIdCounter = 0

export const BackgroundJobProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<BackgroundJob[]>([])

  const addJob = useCallback((label: string = "Calculation") => {
    const id = `job-${++jobIdCounter}-${Date.now()}`
    const newJob: BackgroundJob = {
      id,
      status: "running",
      progress: 0,
      errorMessage: "",
      label,
    }
    setJobs(prev => [...prev, newJob])
    return id
  }, [])

  const updateJob = useCallback((id: string, updates: Partial<Omit<BackgroundJob, 'id'>>) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...updates } : job
    ))
  }, [])

  const removeJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id))
  }, [])

  const getJob = useCallback((id: string) => {
    return jobs.find(job => job.id === id)
  }, [jobs])

  const setJobViewResultsCallback = useCallback((id: string, callback: () => void) => {
    setJobs(prev => prev.map(job =>
      job.id === id ? { ...job, onViewResults: callback } : job
    ))
  }, [])

  return (
    <BackgroundJobContext.Provider
      value={{
        jobs,
        addJob,
        updateJob,
        removeJob,
        getJob,
        setJobViewResultsCallback,
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
