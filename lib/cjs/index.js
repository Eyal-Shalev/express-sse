"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOpts = void 0;
exports.defaultOpts = {
    interval: 1000,
    updateEventName: 'update',
    errorEventName: 'error',
};
/*
 * Stream middleware that opens a stream and attaches clients to opened streams.
 * Sends updates via the Server Sent Events API.
 */
function stream(name, fn, opts = exports.defaultOpts) {
    console.assert(!!name, 'name should not be empty');
    console.assert(!!fn, 'fn should not be empty');
    opts = Object.assign(Object.assign({}, exports.defaultOpts), opts);
    streams[name] = streams[name] || { clients: [], opts, name, fn };
    return (req, res, next) => {
        // Mandatory headers and http status to keep connection open
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        });
        streams[name].clients.push({ req, res });
        updateStreams(name);
        next();
    };
}
exports.default = stream;
const streams = {};
function updateStreams(name) {
    const { clients, opts, fn, timeoutID } = streams[name];
    const { interval, updateEventName, errorEventName } = opts;
    if (clients.length === 0 && timeoutID !== undefined) {
        clearTimeout(timeoutID);
        return;
    }
    if (!!timeoutID) {
        clearTimeout(timeoutID);
    }
    fn()
        .then(data => `event: ${updateEventName}\ndata: ${data}\n\n`)
        .catch(err => `event: ${errorEventName}\ndata: ${err}\n\n`)
        .then(data => {
        clients.forEach(({ res }) => {
            try {
                res.write(data);
            }
            catch (e) {
                console.error("Failed to write data to the client", { e, data, stream: streams[name] });
            }
        });
    })
        .finally(() => {
        streams[name].timeoutID = setTimeout(updateStreams, interval, name);
    });
}
