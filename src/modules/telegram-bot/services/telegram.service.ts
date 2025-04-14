import { ConfigService } from "@nestjs/config";
import TelegramBot from "node-telegram-bot-api";
import { TelegramMessageType } from "src/models/telegram-mesage.model";
import { Logger } from "src/modules/loggers";
import { DataService } from "src/modules/shared/services/data-service.service";

export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private telegramBot: TelegramBot;
    private readonly token: string;
    private readonly adminUsernames: string[];
    private readonly botId: number;
    private readonly approveMessageTemplate: RegExp = new RegExp(/\[(\d+)\]/);
    constructor(
        private readonly configService: ConfigService,
        private readonly dataService: DataService,
    ) {
        this.token = this.configService.get<string>('telegramToken')
        this.botId = Number(this.token.split(':')[0]);
        this.adminUsernames = this.configService.get<string[]>('adminUsernames')
        // Create a bot that uses 'polling' to fetch new updates
        this.telegramBot = new TelegramBot(this.token, { polling: true });
    }

    onModuleInit() {
        [{
            command: '/ask ',
        }, {
            command: '/train ',
        }, {
            command: '/approve',
            permissionCheckingFunc: (msg: TelegramBot.Message) => {
                return this.checkPersmission(msg.from.username);
            },
            buildMessage: (msg: TelegramBot.Message): string => {
                if (!msg.reply_to_message) {
                    return '';
                }

                const replaceMessageFromId = msg.reply_to_message.from.id;
                if (replaceMessageFromId !== this.botId) {
                    return '';
                }

                // [<MessageId>] Data train by username (<first name> <last name>): <train data>
                const messageId = msg.reply_to_message.text.match(this.approveMessageTemplate);
                if (!messageId) {
                    return '';
                }

                const messageIdValue = messageId[1];
                return `/approve ${messageIdValue}`;
            }
        }, {
            command: '/start_train',
            permissionCheckingFunc: (msg: TelegramBot.Message) => {
                return this.checkPersmission(msg.from.username);
            }
        }].forEach(element => {
            this.initEvent(element.command, {
                permissionCheckingFunc: element.permissionCheckingFunc,
                buildMessage: element.buildMessage,
            });
        });
    }

    onModuleDestroy() {
        this.telegramBot.stopPolling();
    }

    public send(
        chatId: string,
        message: string,
        options?: {
            message_thread_id?: string;
            reply_to_message_id?: string;
            reply_parameters?: {
                message_id: string;
                chat_id: string;
            }
        }
    ) {
        return this.telegramBot.sendMessage(chatId, message, options);
    }

    private initEvent(command: string, options?: {
        permissionCheckingFunc?: (msg: TelegramBot.Message) => boolean, 
        buildMessage?: (msg: TelegramBot.Message) => string,
    }) {
        this.telegramBot.onText(new RegExp(command), (msg: TelegramBot.Message) => {
            const chatId = String(msg.chat.id);
            const mesageId = String(msg.message_id);
            const sender = msg.from;
            const message = options?.buildMessage ? options?.buildMessage(msg) : msg.text;
            const resp = this.getMessage(message, command.trim());
            const type = this.getMessageTypeByPrefix(command.trim());

            if (!message) {
                return;
            }

            if (options?.permissionCheckingFunc && !options?.permissionCheckingFunc(msg)) {
                this.send(chatId, 'Permission denied', {
                    reply_parameters: {
                        message_id: mesageId,
                        chat_id: chatId,
                    }
                }).catch((err: any) => {
                    this.logger.error(err);
                });
                return;
            }

            this.dataService.sendTelegramBotMessage({
                type,
                sender,
                originalMessage: msg.text,
                message: resp,
                chatId: chatId,
                messageId: mesageId,
            }).catch((err) => {
                this.logger.error(err);
                this.send(chatId, `Error: ${err.errorMessage ?? 'Unknown error'}`, {
                    reply_parameters: {
                        message_id: mesageId,
                        chat_id: chatId,
                    }
                }).catch((err: any) => {
                    this.logger.error(err);
                });
            })
        })

    }

    private checkPersmission(a: string) {
        return this.adminUsernames.includes(a)
    }

    private getMessage(text: string, prefix: string) {
        const message = text.replace(prefix, '').trim();
        return message;
    }

    private getMessageTypeByPrefix(prefix: string): TelegramMessageType {
        switch (prefix) {
            case '/ask':
                return TelegramMessageType.ASK;
            case '/train':
                return TelegramMessageType.TRAIN;
            case '/approve':
                return TelegramMessageType.APPROVE;
            case '/start_train':
                return TelegramMessageType.START_TRAIN;
            default:
                return null;
        }
    }
}