import React, { useEffect, useState } from 'react'
import './styles/LogPage.css'
import { getJobLog, subscribeToJobLog, JobLog } from '../utils/jobStore'

export default function LogPage() {
  const [jobLog, setJobLog] = useState<JobLog>(getJobLog())

  useEffect(() => {
    const unsubscribe = subscribeToJobLog(() => {
      setJobLog(getJobLog())
    })
    return unsubscribe
  }, [])

  return (
    <div className="joblog">
      <div className="joblog__header">
        <div className="joblog__title">
          <h1 className="joblog__heading">Logs</h1>
          <span className="joblog__meta">
            {jobLog.activeJobId ? `Job: ${jobLog.activeJobId}` : 'No active job'}
          </span>
        </div>
      </div>

      <div className="joblog__card">
        <pre className="joblog__log">
          {jobLog.fullLog || 'No logs yet. Start a download to see detailed logs here.'}
        </pre>
      </div>
    </div>
  )
}
