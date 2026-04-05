"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInteractiveMessage = exports.sendListMenu = exports.sendCallButton = exports.sendQuickReplyButtons = exports.sendUrlButton = exports.sendCopyButton = void 0;

const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");

/**
 * Función auxiliar para crear mensajes interactivos compatibles
 * Usa el formato viewOnceMessage que funciona en todas las versiones de WhatsApp
 */
async function createInteractiveMessage(sock, jid, content, quotedMsg = null) {
    try {
        const message = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create(content)
                }
            }
        }, {});

        await sock.relayMessage(jid, message.message, { 
            messageId: message.key.id,
            quoted: quotedMsg 
        });
        
        return true;
    } catch (error) {
        console.error('[interactive] Error creando mensaje interactivo:', error);
        // Fallback a mensaje de texto simple
        await sock.sendMessage(jid, { text: content.body?.text || 'Error al cargar menú' });
        return false;
    }
}

/**
 * Envía un mensaje con botón que copia texto al portapapeles
 */
async function sendCopyButton(sock, jid, text, copyText, buttonText) {
    try {
        const content = {
            body: proto.Message.InteractiveMessage.Body.create({ text: text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: '⚡ Asta-Bot' }),
            header: proto.Message.InteractiveMessage.Header.create({ 
                title: '📋 Copiar Código',
                hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [{
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: buttonText || '📋 Copiar',
                        copy_code: copyText
                    })
                }]
            })
        };

        await createInteractiveMessage(sock, jid, content);
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
        const content = {
            body: proto.Message.InteractiveMessage.Body.create({ text: text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: '⚡ Asta-Bot' }),
            header: proto.Message.InteractiveMessage.Header.create({ 
                title: '🔗 Enlace Rápido',
                hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: buttonText || '🔗 Abrir Enlace',
                        url: url,
                        merchant_url: url
                    })
                }]
            })
        };

        await createInteractiveMessage(sock, jid, content);
    } catch (error) {
        console.error('[interactive] Error en sendUrlButton:', error);
        await sock.sendMessage(jid, { text: `${text}\n\n🔗 Enlace: ${url}` });
    }
}
exports.sendUrlButton = sendUrlButton;

/**
 * Envía un mensaje con botones de respuesta rápida (MÁS COMPATIBLE)
 */
async function sendQuickReplyButtons(sock, jid, text, buttons) {
    try {
        // Limitar a 3 botones para máxima compatibilidad
        const limitedButtons = buttons.slice(0, 3);
        
        const interactiveButtons = limitedButtons.map(btn => ({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: btn.text,
                id: btn.id
            })
        }));

        const content = {
            body: proto.Message.InteractiveMessage.Body.create({ text: text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: '⚡ Asta-Bot - Selecciona una opción' }),
            header: proto.Message.InteractiveMessage.Header.create({
                hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: interactiveButtons
            })
        };

        await createInteractiveMessage(sock, jid, content);
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
        const content = {
            body: proto.Message.InteractiveMessage.Body.create({ text: text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: '⚡ Asta-Bot' }),
            header: proto.Message.InteractiveMessage.Header.create({ 
                title: '📞 Llamar',
                hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [{
                    name: 'cta_call',
                    buttonParamsJson: JSON.stringify({
                        display_text: buttonText || '📞 Llamar Ahora',
                        phone_number: phoneNumber
                    })
                }]
            })
        };

        await createInteractiveMessage(sock, jid, content);
    } catch (error) {
        console.error('[interactive] Error en sendCallButton:', error);
        await sock.sendMessage(jid, { text: `${text}\n\n📞 Llama a: ${phoneNumber}` });
    }
}
exports.sendCallButton = sendCallButton;

/**
 * Envía un mensaje con lista desplegable (single select) - REPARADO PARA COMPATIBILIDAD
 */
async function sendListMenu(sock, jid, text, title, sections, quotedMsg = null) {
    try {
        // Formatear secciones correctamente para WhatsApp
        const formattedSections = sections.map(section => ({
            title: section.title,
            rows: section.rows.map(row => ({
                header: row.header || '',
                title: row.title,
                description: row.description || '',
                id: row.id
            }))
        }));

        const content = {
            body: proto.Message.InteractiveMessage.Body.create({ text: text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: '⚡ Asta-Bot - Menú Interactivo' }),
            header: proto.Message.InteractiveMessage.Header.create({ 
                title: title || '📋 Menú de Opciones',
                hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📋 Ver opciones',
                        sections: formattedSections
                    })
                }]
            })
        };

        await createInteractiveMessage(sock, jid, content, quotedMsg);
    } catch (error) {
        console.error('[interactive] Error en sendListMenu:', error);
        // Fallback: enviar como texto plano
        let fallbackText = `${text}\n\n`;
        sections.forEach(sec => {
            fallbackText += `\n*${sec.title}*\n`;
            sec.rows.forEach(row => {
                fallbackText += `• ${row.id} - ${row.title}\n`;
            });
        });
        await sock.sendMessage(jid, { text: fallbackText }, { quoted: quotedMsg });
    }
}
exports.sendListMenu = sendListMenu;

/**
 * Envía un mensaje con múltiples botones combinados
 */
async function sendInteractiveMessage(sock, jid, text, buttonsConfig) {
    try {
        // Limitar a 3 botones para compatibilidad
        const limitedButtons = buttonsConfig.slice(0, 3);
        
        const buttons = limitedButtons.map(btn => {
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

        const content = {
            body: proto.Message.InteractiveMessage.Body.create({ text: text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: '⚡ Asta-Bot' }),
            header: proto.Message.InteractiveMessage.Header.create({
                hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons })
        };

        await createInteractiveMessage(sock, jid, content);
    } catch (error) {
        console.error('[interactive] Error en sendInteractiveMessage:', error);
        await sock.sendMessage(jid, { text: text });
    }
}
exports.sendInteractiveMessage = sendInteractiveMessage;
