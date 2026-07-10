import makeWASocket from './Socket/index'

// Banner de marca al cargar la librería
// eslint-disable-next-line no-console
console.log('\x1b[97m%s\x1b[0m\x1b[36m%s\x1b[0m', 'Baileys ', 'By ASTA-BOTS\n')

export * from '../WAProto/index.js'
export * from './Utils/index'
export * from './Store/index'
export * from './Types/index'
export * from './Defaults/index'
export * from './WABinary/index'
export * from './WAM/index'
export * from './WAUSync/index'

export type WASocket = ReturnType<typeof makeWASocket>
export { makeWASocket }
export default makeWASocket
