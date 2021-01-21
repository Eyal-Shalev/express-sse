import {NextFunction, Request, RequestHandler, Response} from 'express';

export interface Options {
  interval?: number;
  updateEventName?: string;
  errorEventName?: string;
}

export const defaultOpts: Options = {
  interval: 1000,
  updateEventName: 'update',
  errorEventName: 'error',
};

/*
 * Stream middleware that opens a stream and attaches clients to opened streams.
 * Sends updates via the Server Sent Events API.
 */
export default function stream(name: string, fn: DataFunc, opts: Options = defaultOpts): RequestHandler {
  console.assert(!!name, 'name should not be empty');
  console.assert(!!fn, 'fn should not be empty');
  opts = {...defaultOpts, ...opts};

  streams[name] = streams[name] || {clients: [], opts, name, fn}

  return (req: Request, res: Response, next: NextFunction) => {
    // Mandatory headers and http status to keep connection open
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    });

    streams[name].clients.push({req, res});
    updateStreams(name);
    next();
  }
}

type DataFunc = () => Promise<string>

interface Client {
  req: Request;
  res: Response;
}

interface Stream {
  clients: Client[];
  opts: Options;
  name: string;
  fn: DataFunc;
  timeoutID?: number;
}

const streams: { [k: string]: Stream } = {};

function updateStreams(name: string) {
  const {clients, opts, fn, timeoutID} = streams[name];
  const {interval, updateEventName, errorEventName} = opts;

  if (clients.length === 0 && timeoutID !== undefined) {
    clearTimeout(timeoutID);
    return
  }
  if (!!timeoutID) {
    clearTimeout(timeoutID)
  }

  fn()
    .then(data => `event: ${updateEventName}\ndata: ${data}\n\n`)
    .catch(err => `event: ${errorEventName}\ndata: ${err}\n\n`)
    .then(data => {
      clients.forEach(({res}) => {
        try {
          res.write(data);
        } catch (e) {
          console.error("Failed to write data to the client", {e, data, stream: streams[name]})
        }
      })
    })
    .finally(() => {
      streams[name].timeoutID = setTimeout(updateStreams, interval, name)
    })
}