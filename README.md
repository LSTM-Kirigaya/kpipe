# ompipe 🚀
![Node.js Pipeline](https://img.shields.io/badge/Node.js-Pipeline-brightgreen?style=flat&logo=node.js) ![License](https://img.shields.io/github/license/LSTM-Kirigaya/kpipe) ![Version](https://img.shields.io/npm/v/kpipe)

Light and useful pipeline manager tool for Node.js

## Features ✨
- Simple and intuitive API
- Lightweight with zero dependencies
- Supports parallel and sequential execution
- Easy error handling and recovery
- Fully typed with TypeScript support

## Installation
```bash
npm install ompipe
```

## Usage
```typescript
import { OmPipe } from "ompipe";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
```

when you run code above first time, you will receive this output:

```
→ execute compile ...
→ execute print something ...
pipeline end
```

when you run code again, you will receive this output:

```
✓ task (compile) is success executed at 2025/6/3 19:00:53, skip
✓ task (print something) is success executed at 2025/6/3 19:00:54, skip
pipeline end
```


All the state during task execution will be stored in `.pipeline`.