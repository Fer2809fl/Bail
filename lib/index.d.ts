import makeWASocket from './Socket/index.js';
export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export { Dugong } from './Socket/dugong.js';
// -- Añadido en v7.0.5: portado desde el fork beta (tipado laxo, ver README) --
export declare const VERSION: string;
export declare class Button {
    [key: string]: any;
    constructor(...args: any[]);
}
export declare class ButtonV2 {
    [key: string]: any;
    constructor(...args: any[]);
}
export declare class Carousel {
    [key: string]: any;
    constructor(...args: any[]);
}
export declare class AIRich {
    [key: string]: any;
    constructor(...args: any[]);
}
export declare class ORich extends AIRich {
}
export declare const Toolkit: any;
export declare class VoipClient {
    [key: string]: any;
    constructor(...args: any[]);
}
export declare class ActiveCall {
    [key: string]: any;
    constructor(...args: any[]);
}
/** Mirrors the WhatsApp WASM `CallState` enum. */
export declare const CallState: {
    readonly Idle: 0;
    readonly Calling: 1;
    readonly PreacceptReceived: 2;
    readonly ReceivedCall: 3;
    readonly AcceptSent: 4;
    readonly AcceptReceived: 5;
    readonly Active: 6;
    readonly ActiveElsewhere: 7;
    readonly Ending: 13;
};
export type WASocket = ReturnType<typeof makeWASocket>;
export { makeWASocket };
export default makeWASocket;
//# sourceMappingURL=index.d.ts.map