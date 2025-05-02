import { v2 } from "@google-cloud/run";

export const jobsClient = new v2.JobsClient();

export const executionsClient = new v2.ExecutionsClient();