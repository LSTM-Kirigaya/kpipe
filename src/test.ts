import { KPipe } from "./pipe";

async function main() {
    const pipe = new KPipe('test');

    console.log('begin pipeline');
    
    pipe.addTask('compile', async (ctx) => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        return 'hello world';
    }, { critical: true });

    pipe.addTask('print something', async (ctx) => {
        const res = ctx.getTaskResult('compile');
        console.log(res);
        
    });

    await pipe.start();

    console.log('pipeline end');
}

main();