import * as fs from 'fs';
import { AddQueueOption, DispatchWorker, KPipelineConfig, TaskState } from './pipe.dto';
import chalk from 'chalk';

export class OmPipe {
    private configPath = '.pipeline';
    private version = '0.0.1';
    private taskQueue: DispatchWorker[] = [];
    private config?: KPipelineConfig;

    constructor(
        public taskId: string
    ) {
        // 根据 taskId 进行数据恢复
        if (!fs.existsSync(this.configPath)) {
            fs.writeFileSync(this.configPath, JSON.stringify({
                version: this.version,
                name: 'kpipe',
                scopes: { [taskId]: [] }
            }));
        }

        try {
            this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        } catch (error) {
            console.log('fail to parse config');
            this.config = {
                version: this.version,
                name: 'kpipe',
                scopes: { [taskId]: [] }
            }

            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        }
    }

    public saveState() {
        this.config!.scopes[this.taskId] = this.taskQueue.map(task => task.state);
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    }

    public loadState() {
        try {
            this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        } catch (error) {
            console.log('fail to parse config');
            this.config = {
                version: this.version,
                name: 'kpipe',
                scopes: { [this.taskId]: [] }
            }
        }

        return this.config?.scopes[this.taskId] || [];
    }

    private getDefaultState(id: string, option: AddQueueOption): TaskState {
        return {
            id,
            status: 'pending',
            startTime: Date.now(),
            endTime: Date.now(),
            result: null,
            error: null,
            retryCount: 0,
            option
        };
    }

    public add(
        id: string,
        worker: (ctx: OmPipe) => Promise<any> | any,
        option: AddQueueOption = {}
    ) {
        const state = this.getDefaultState(id, option);
        const dispatchWorker = { worker, state } as DispatchWorker;
        this.taskQueue.push(dispatchWorker);
    }

    public getTaskResult(id: string) {
        const task = this.taskQueue.find(task => task.state.id === id);
        if (!task) {
            throw new Error(`task ${id} not found`);
        }
        return task.state.result;
    }

    private async executeTask(task: DispatchWorker) {

        const {
            critical = false,
            maxRetryCount = 0,
            retryInterval = 0
        } = task.state.option;

        while (true) {
            try {
                task.state.status = 'running';
                task.state.startTime = Date.now();
                this.saveState();

                const res = await task.worker(this);
                if (res !== undefined) {
                    task.state.result = res;
                }

                task.state.status = 'success';
                task.state.endTime = Date.now();
                this.saveState();

                return {
                    stop: false
                };

            } catch (error) {
                console.log(chalk.red('task failed'), error);
                task.state.error = error;
            }

            // judge if loop continue
            if (maxRetryCount > 0) {
                if (task.state.retryCount >= maxRetryCount) {
                    task.state.status = 'failed';
                    this.saveState();
                    return { stop: critical };
                } else {
                    task.state.retryCount ++;
                    task.state.status = 'pending';
                }
            } else {
                task.state.status = 'failed';
                this.saveState();
                return { stop: critical };
            }

            if (retryInterval > 0) {
                await new Promise(resolve => setTimeout(resolve, task.state.option.retryInterval));
            }
        }
    }

    public async start() {
        const persistedStates = this.config!.scopes[this.taskId] || [];
        const persistedStateMap = new Map<string, TaskState>();

        const currentQueueTaskId = new Set<string>();
        for (const task of this.taskQueue) {
            currentQueueTaskId.add(task.state.id);
        }

        for (const state of persistedStates) {
            // if state not in current queue, skip
            if (!currentQueueTaskId.has(state.id)) {
                continue;
            }
            persistedStateMap.set(state.id, state);
        }

        for (const task of this.taskQueue) {

            const persistedState = persistedStateMap.get(task.state.id);
            // skip task tagged as success
            if (persistedState && persistedState.status === 'success') {
                const endTime = persistedState.endTime;

                // formatted endTime
                const formattedEndTime = new Date(endTime).toLocaleString();
                console.log(chalk.green(`✓ task (${task.state.id}) is success`), 
                    chalk.dim(`executed at ${formattedEndTime}, skip`));
                continue;
            }

            console.log(chalk.blue('→ execute ' + task.state.id), '...');
            
            const { stop } = await this.executeTask(task);
            if (stop) {
                break;
            }
        }
    }
}

