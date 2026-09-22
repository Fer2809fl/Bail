import { Mutex } from 'async-mutex';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { proto } from '../../WAProto/index.js';
import { initAuthCreds } from './auth-utils.js';
import { BufferJSON } from './generics.js';
/**
 * Guarda toda la sesión (creds + todas las keys) en un único archivo JSON,
 * con todo cacheado en memoria. A diferencia de useMultiFileAuthState, aquí
 * no se crea un archivo por cada key (senderKey, preKey, app-state, etc.),
 * lo cual es mucho más liviano en disco cuando tienes muchos subbots
 * corriendo en el mismo hosting.
 *
 * Trade-off: cada escritura reserializa el archivo completo, así que en
 * sesiones con MUCHÍSIMAS keys (miles) useMultiFileAuthState puede ser más
 * eficiente en I/O. Para el uso normal de un bot (uno o varios subbots) esto
 * es más que suficiente y bastante más simple de respaldar/mover (un solo
 * archivo).
 * */
export const useSingleFileAuthState = async (filePath) => {
    const fileMutex = new Mutex();
    /** @type {{ creds: any, keys: Record<string, Record<string, any>> }} */
    let db = { creds: undefined, keys: {} };
    const dir = dirname(filePath);
    const dirInfo = await stat(dir).catch(() => undefined);
    if (!dirInfo) {
        await mkdir(dir, { recursive: true });
    }
    const load = async () => {
        try {
            const raw = await readFile(filePath, { encoding: 'utf-8' });
            const parsed = JSON.parse(raw, BufferJSON.reviver);
            db = {
                creds: parsed.creds,
                keys: parsed.keys || {}
            };
        }
        catch {
            db = { creds: undefined, keys: {} };
        }
    };
    const persist = async () => {
        const release = await fileMutex.acquire();
        try {
            await writeFile(filePath, JSON.stringify(db, BufferJSON.replacer));
        }
        finally {
            release();
        }
    };
    await load();
    if (!db.creds) {
        db.creds = initAuthCreds();
        await persist();
    }
    return {
        state: {
            creds: db.creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    const bucket = db.keys[type] || {};
                    for (const id of ids) {
                        let value = bucket[id];
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        db.keys[category] = db.keys[category] || {};
                        for (const id in data[category]) {
                            const value = data[category][id];
                            if (value) {
                                db.keys[category][id] = value;
                            }
                            else {
                                delete db.keys[category][id];
                            }
                        }
                    }
                    await persist();
                }
            }
        },
        saveCreds: async () => {
            db.creds = db.creds;
            await persist();
        }
    };
};
