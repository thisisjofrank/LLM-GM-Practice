import { GameManager } from "../game/GameManager.ts";

export interface WebSocketMessage {
    type: 'gm_prompt' | 'join_game' | 'get_status';
    gameId?: string;
    message?: string;
}

export class WebSocketHandler {
    private gameManager: GameManager;
    private connections: Map<string, WebSocket> = new Map();

    constructor(gameManager: GameManager) {
        this.gameManager = gameManager;
    }

    handleConnection(req: Request): Response {
        const { socket, response } = Deno.upgradeWebSocket(req);

        const connectionId = crypto.randomUUID();
        this.connections.set(connectionId, socket);

        socket.onopen = () => {
            console.log(`WebSocket connection opened: ${connectionId}`);
            this.sendMessage(socket, {
                type: 'system',
                message: 'Connected to D&D LLM Chat server'
            });
        };

        socket.onmessage = async (event) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                await this.handleMessage(socket, data);
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
                this.sendMessage(socket, {
                    type: 'error',
                    message: 'Invalid message format'
                });
            }
        };

        socket.onclose = () => {
            console.log(`WebSocket connection closed: ${connectionId}`);
            this.connections.delete(connectionId);
        };

        socket.onerror = (error) => {
            console.error(`WebSocket error for ${connectionId}:`, error);
        };

        return response;
    }

    private async handleMessage(socket: WebSocket, data: WebSocketMessage): Promise<void> {
        switch (data.type) {
            case 'gm_prompt': {
                if (!data.gameId || !data.message) {
                    this.sendMessage(socket, {
                        type: 'error',
                        message: 'Missing gameId or message'
                    });
                    return;
                }

                try {
                    await this.gameManager.processGMPrompt(data.gameId, data.message);

                    // Send responses from each character
                    const game = this.gameManager.getGameStatus(data.gameId);
                    if (game) {
                        // Get all messages after the GM prompt was added
                        const gmPromptIndex = game.messages.findLastIndex(msg =>
                            msg.speaker === 'GM' || msg.speaker === 'Game Master'
                        );

                        if (gmPromptIndex >= 0) {
                            const characterResponses = game.messages.slice(gmPromptIndex + 1)
                                .filter(msg => msg.type === 'character');

                            for (const message of characterResponses) {
                                this.broadcastToGame(data.gameId, {
                                    type: 'character_response',
                                    speaker: message.speaker,
                                    message: message.message
                                });

                                // Add a small delay between character responses for better UX
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }
                    }
                } catch (error) {
                    this.sendMessage(socket, {
                        type: 'error',
                        message: `Error processing GM prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                }
                break;
            }

            case 'join_game': {
                if (!data.gameId) {
                    this.sendMessage(socket, {
                        type: 'error',
                        message: 'Missing gameId'
                    });
                    return;
                }

                const game = this.gameManager.getGameStatus(data.gameId);
                if (game) {
                    // Send game history to newly joined player
                    for (const message of game.messages) {
                        this.sendMessage(socket, {
                            type: message.type,
                            speaker: message.speaker,
                            message: message.message
                        });
                    }
                } else {
                    this.sendMessage(socket, {
                        type: 'error',
                        message: 'Game not found'
                    });
                }
                break;
            }

            case 'get_status': {
                if (!data.gameId) {
                    this.sendMessage(socket, {
                        type: 'error',
                        message: 'Missing gameId'
                    });
                    return;
                }

                const status = this.gameManager.getGameStatus(data.gameId);
                this.sendMessage(socket, {
                    type: 'game_status',
                    data: status
                });
                break;
            }

            default:
                this.sendMessage(socket, {
                    type: 'error',
                    message: 'Unknown message type'
                });
        }
    }

    private sendMessage(socket: WebSocket, message: object): void {
        try {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
            }
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
        }
    }

    private broadcastToGame(_gameId: string, message: object): void {
        // For now, broadcast to all connections
        // In a more sophisticated implementation, you'd track which connections are for which games
        for (const socket of this.connections.values()) {
            this.sendMessage(socket, message);
        }
    }

    // Method to broadcast system messages
    broadcastSystemMessage(message: string): void {
        const systemMessage = {
            type: 'system',
            message: message
        };

        for (const socket of this.connections.values()) {
            this.sendMessage(socket, systemMessage);
        }
    }

    // Get connection count for monitoring
    getConnectionCount(): number {
        return this.connections.size;
    }
}
