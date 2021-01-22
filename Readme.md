# Simple Express Server Sent Events Middleware (using TypeScript)

## Example
```typescript
import express from 'express';
import stream from 'express-sse';

const app = express();

const clockFn = async () => new Date(Date.now()).toLocaleTimeString();
app.use('/clock', stream('clock', clockFn));

app.listen(8080, () => {
  console.log('listening on port 8080');
});
```