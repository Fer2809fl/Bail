import makeWASocket from './Socket/index.js';
export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export { Dugong } from './Socket/dugong.js';
// -- Añadido en v7.0.5: portado desde el fork beta --
export * from './Modded/message_builder.js';
export { VoipClient, ActiveCall, CallState } from './VoIP/index.js';
export { makeWASocket };
export default makeWASocket;
//# sourceMappingURL=index.js.map