"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInteractiveMessage = exports.sendListMenu = exports.sendCallButton = exports.sendQuickReplyButtons = exports.sendUrlButton = exports.sendCopyButton = void 0;

/**
 * Envía un mensaje con botón que copia texto al portapapeles
 */
async function sendCopyButton(sock, jid, text, copyText, buttonText) {
    try {
        await sock.sendMessage(jid, {
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                header: { 
                    title: '📋 Copiar Código',
                    hasMediaAttachment: false
                },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: buttonText || '📋 Copiar',
                            copy_code: copyText
                        })
                    }]
                }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendCopyButton:', error);
        await sock.sendMessage(jid, { text: `${text}\n\n📋 Copia esto: ${copyText}` });
    }
}
exports.sendCopyButton = sendCopyButton;

/**
 * Envía un mensaje con botón de enlace (URL)
 */
async function sendUrlButton(sock, jid, text, url, buttonText) {
    try {
        await sock.sendMessage(jid, {
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                header: { 
                    title: '🔗 Enlace Rápido',
                    hasMediaAttachment: false
                },
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
        await sock.sendMessage(jid, { text: `${text}\n\n🔗 Enlace: ${url}` });
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
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot - Selecciona una opción' },
                header: {
                    hasMediaAttachment: false
                },
                nativeFlowMessage: {
                    buttons: interactiveButtons
                }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendQuickReplyButtons:', error);
        const buttonsText = buttons.map(b => `• ${b.text} → ${b.id}`).join('\n');
        await sock.sendMessage(jid, { text: `${text}\n\n${buttonsText}` });
    }
}
exports.sendQuickReplyButtons = sendQuickReplyButtons;

/**
 * Envía un mensaje con botón de llamada telefónica
 */
async function sendCallButton(sock, jid, text, phoneNumber, buttonText) {
    try {
        await sock.sendMessage(jid, {
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                header: { 
                    title: '📞 Llamar',
                    hasMediaAttachment: false
                },
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
        await sock.sendMessage(jid, { text: `${text}\n\n📞 Llama a: ${phoneNumber}` });
    }
}
exports.sendCallButton = sendCallButton;

/**
 * Envía un mensaje con lista desplegable (single select)
 */
async function sendListMenu(sock, jid, text, title, sections) {
    try {
        // Formatear secciones correctamente
        const formattedSections = sections.map(section => ({
            title: section.title,
            rows: section.rows.map(row => ({
                header: row.header || '',
                title: row.title,
                description: row.description || '',
                id: row.id
            }))
        }));

        await sock.sendMessage(jid, {
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot - Menú Interactivo' },
                header: { 
                    title: title || '📋 Menú de Opciones',
                    hasMediaAttachment: false
                },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📋 Ver opciones',
                            sections: formattedSections
                        })
                    }]
                }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendListMenu:', error);
        let fallbackText = `${text}\n\n`;
        sections.forEach(sec => {
            fallbackText += `\n*${sec.title}*\n`;
            sec.rows.forEach(row => {
                fallbackText += `• ${row.id} - ${row.title}\n`;
            });
        });
        await sock.sendMessage(jid, { text: fallbackText });
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
                            copy_code: btn.value
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
            interactiveMessage: {
                body: { text: text },
                footer: { text: '⚡ Asta-Bot' },
                header: {
                    hasMediaAttachment: false
                },
                nativeFlowMessage: { buttons }
            }
        });
    } catch (error) {
        console.error('[interactive] Error en sendInteractiveMessage:', error);
        await sock.sendMessage(jid, { text: text });
    }
}
exports.sendInteractiveMessage = sendInteractiveMessage;
