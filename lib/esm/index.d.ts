import { RequestHandler } from 'express';
export interface Options {
    interval?: number;
    updateEventName?: string;
    errorEventName?: string;
}
export declare const defaultOpts: Options;
export default function stream(name: string, fn: DataFunc, opts?: Options): RequestHandler;
declare type DataFunc = () => Promise<string>;
export {};
