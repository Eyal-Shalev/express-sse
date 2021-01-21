import express from 'express';
import stream from 'express-sse';

const app = express();

const dateFn = async () => new Date(Date.now()).toLocaleTimeString();
app.use('/clock', stream('clock', dateFn));

let sevenBoomCounter = 0;
const sevenBoomFn = async () => {
    sevenBoomCounter++;
    switch (true) {
        case sevenBoomCounter % 7 === 0:
            return 'BOOM';
        case sevenBoomCounter.toString().includes('7'):
            return 'BOOM'
        default:
            return sevenBoomCounter.toString()
    }
};
app.use('/7-boom', stream('7-boom', sevenBoomFn));

app.listen(1234, () => {
    console.log('listening on port 1234');
});