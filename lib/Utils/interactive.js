"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInteractiveMessage = exports.sendListMenu = exports.sendCallButton = exports.sendQuickReplyButtons = exports.sendUrlButton = exports.sendCopyButton = void 0;

/**
 * Envía un mensaje con botón que copia texto al portapapeles
 */
async function sendCopyButton(sock, jid, text, copyText, buttonText) {
    try {
        await sock.sendMessage(jid, {
            text: text,
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                header: { title: '📋 Copiar Código' },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: buttonText || '📋 Copiar',
                            copy_code: copyText,
                            id: Date.now().toString()
                        })
                    }]
                }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendCopyButton:', error);
        throw error;
    }
}
exports.sendCopyButton = sendCopyButton;

/**
 * Envía un mensaje con botón de enlace (URL)
 */
async function sendUrlButton(sock, jid, text, url, buttonText) {
    try {
        await sock.sendMessage(jid, {
            text: text,
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                header: { title: '🔗 Enlace Rápido' },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: buttonText || '🔗 Abrir Enlace',
                            url: url,
                            merchant_url: url
                        })
                    }]
                }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendUrlButton:', error);
        throw error;
    }
}
exports.sendUrlButton = sendUrlButton;

/**
 * Envía un mensaje con botones de respuesta rápida
 */
async function sendQuickReplyButtons(sock, jid, text, buttons) {
    try {
        const interactiveButtons = buttons.map(btn => ({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: btn.text,
                id: btn.id
            })
        }));

        await sock.sendMessage(jid, {
            text: text,
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                nativeFlowMessage: {
                    buttons: interactiveButtons
                }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendQuickReplyButtons:', error);
        throw error;
    }
}
exports.sendQuickReplyButtons = sendQuickReplyButtons;

/**
 * Envía un mensaje con botón de llamada telefónica
 */
async function sendCallButton(sock, jid, text, phoneNumber, buttonText) {
    try {
        await sock.sendMessage(jid, {
            text: text,
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                header: { title: '📞 Llamar' },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'cta_call',
                        buttonParamsJson: JSON.stringify({
                            display_text: buttonText || '📞 Llamar Ahora',
                            phone_number: phoneNumber
                        })
                    }]
                }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendCallButton:', error);
        throw error;
    }
}
exports.sendCallButton = sendCallButton;

/**
 * Envía un mensaje con lista desplegable (single select)
 */
async function sendListMenu(sock, jid, text, title, sections) {
    try {
        await sock.sendMessage(jid, {
            text: text,
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                header: { title: title || '📋 Menú de Opciones' },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Selecciona una opción',
                            sections: sections
                        })
                    }]
                }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendListMenu:', error);
        throw error;
    }
}
exports.sendListMenu = sendListMenu;

/**
 * Envía un mensaje con múltiples botones combinados
 */
async function sendInteractiveMessage(sock, jid, text, buttonsConfig) {
    try {
        const buttons = buttonsConfig.map(btn => {
            let buttonParams = {};
            
            switch (btn.type) {
                case 'copy':
                    buttonParams = {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: btn.text,
                            copy_code: btn.value,
                            id: btn.id || Date.now().toString()
                        })
                    };
                    break;
                case 'url':
                    buttonParams = {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: btn.text,
                            url: btn.value,
                            merchant_url: btn.value
                        })
                    };
                    break;
                case 'call':
                    buttonParams = {
                        name: 'cta_call',
                        buttonParamsJson: JSON.stringify({
                            display_text: btn.text,
                            phone_number: btn.value
                        })
                    };
                    break;
                case 'quick':
                    buttonParams = {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: btn.text,
                            id: btn.id || btn.value
                        })
                    };
                    break;
                default:
                    buttonParams = {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: btn.text,
                            id: btn.id || btn.value
                        })
                    };
            }
            return buttonParams;
        });

        await sock.sendMessage(jid, {
            text: text,
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                nativeFlowMessage: { buttons }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendInteractiveMessage:', error);
        throw error;
    }
}
exports.sendInteractiveMessage = sendInteractiveMessage;
