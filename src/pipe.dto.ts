import type { OmPipe } from "./pipe";

export interface KPipelineConfig {
    name?: string;
    version?: string;
    scopes: Record<string, TaskState[]>;
}

export interface TaskOption {
    
}

export interface AddQueueOption {
    /**
     * @description if set to true, the pipeline will terminate when this task failed
     * @default false
     */
    critical?: boolean;

    /**
     * @description the max retry count
     * @default 0
     */
    maxRetryCount?: number;

    /**
     * @description the retry interval
     * @default 0
     */
    retryInterval?: number;
}

export interface DispatchWorker {
    worker: (ctx: OmPipe) => Promise<any> | any
    state: TaskState;
}

export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

export interface TaskState {
    id: string;
    status: TaskStatus;
    startTime: number;
    endTime: number;
    result?: any;
    error?: any;
    retryCount: number;
    option: AddQueueOption;   
}