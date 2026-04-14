import { jobs } from '@/data/mockData';

let jobStore = jobs.map((item) => ({ ...item }));

export async function getJobs() {
  return jobStore.map((item) => ({ ...item }));
}

export async function assignJob(payload) {
  const newJob = {
    id: `JOB-${String(jobStore.length + 1).padStart(3, '0')}`,
    hasVideo: false,
    status: 'Assigned',
    ...payload,
  };

  jobStore = [newJob, ...jobStore];
  return { ...newJob };
}

export async function updateJobStatus(jobId, status) {
  jobStore = jobStore.map((job) =>
    job.id === jobId
      ? {
          ...job,
          status,
        }
      : job
  );

  return jobStore.find((job) => job.id === jobId) || null;
}
