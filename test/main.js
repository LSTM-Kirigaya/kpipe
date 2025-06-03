const { OmPipe } = require('../dist/index');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const pipe = new OmPipe('test');
    
    pipe.add('compile', async (ctx) => {
        await sleep(1000);
        // return value will be stored in context persistantly
        return 'hello world';

        // tag this task as critical, if it fails, the pipeline will be stopped
    }, { critical: true });

    pipe.add('print something', async (ctx) => {
        // you can get the result of history task by using ctx.getTaskResult(taskName)
        // even if it has been executed in the past
        const res = ctx.getTaskResult('compile');
        // this res is "hello world"
        await sleep(1000);
    });

    await pipe.start();

    console.log('pipeline end');
}

main();