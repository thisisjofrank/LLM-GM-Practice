import { Character } from "./Character.ts";
import { LLMProvider } from "../llm/LLMProvider.ts";

export interface GameState {
    id: string;
    gmPrompt: string;
    characters: Character[];
    messages: GameMessage[];
    currentTurn: number;
    isActive: boolean;
    createdAt: Date;
}

export interface GameMessage {
    id: string;
    speaker: string;
    message: string;
    timestamp: Date;
    type: 'gm' | 'character' | 'system';
}

export interface StartGameRequest {
    gmPrompt: string;
    characters: Array<{
        name: string;
        class: string;
        personality: string;
    }>;
}

export class GameManager {
    private games: Map<string, GameState> = new Map();
    private llmProvider: LLMProvider;

    constructor() {
        this.llmProvider = new LLMProvider();
    }

    async startNewGame(gmPrompt: string, characterConfigs: StartGameRequest['characters']): Promise<string> {
        const gameId = crypto.randomUUID();

        // Create characters with their LLM personalities
        const characters = characterConfigs.map(config =>
            new Character(
                config.name,
                config.class,
                config.personality,
                this.llmProvider
            )
        );

        const gameState: GameState = {
            id: gameId,
            gmPrompt,
            characters,
            messages: [],
            currentTurn: 0,
            isActive: true,
            createdAt: new Date()
        };

        this.games.set(gameId, gameState);

        // Initialize the game with GM's opening prompt
        this.addMessage(gameId, 'GM', gmPrompt, 'gm');

        // Let each character introduce themselves
        for (const character of characters) {
            const introduction = await character.generateIntroduction(gmPrompt);
            this.addMessage(gameId, character.name, introduction, 'character');
        }

        return gameId;
    }

    async processGMPrompt(gameId: string, prompt: string): Promise<void> {
        const game = this.games.get(gameId);
        if (!game || !game.isActive) {
            throw new Error('Game not found or not active');
        }

        console.log(`Processing GM prompt for game ${gameId}: "${prompt}"`);

        // Add GM message
        this.addMessage(gameId, 'GM', prompt, 'gm');

        // Check if the GM is directly addressing a specific character
        const addressedCharacter = this.findAddressedCharacter(prompt, game.characters);

        if (addressedCharacter) {
            // Only the addressed character responds
            console.log(`GM is addressing ${addressedCharacter.name} specifically`);
            try {
                const response = await addressedCharacter.generateResponse(prompt, this.getRecentContext(game), []);
                console.log(`${addressedCharacter.name} responded: "${response.substring(0, 50)}..."`);
                this.addMessage(gameId, addressedCharacter.name, response, 'character');
            } catch (error) {
                console.error(`Error getting response from ${addressedCharacter.name}:`, error);
                const fallbackMessage = `*${addressedCharacter.name} seems speechless*`;
                this.addMessage(gameId, addressedCharacter.name, fallbackMessage, 'character');
            }
        } else {
            // All characters respond (existing behavior)
            console.log('GM is addressing the entire party');
            const partyActions: string[] = [];

            for (let i = 0; i < game.characters.length; i++) {
                const character = game.characters[i];
                console.log(`Getting response from ${character.name}...`);

                try {
                    // Pass previous party members' actions to this character
                    const currentPartyActions = partyActions.slice(); // Copy current actions
                    const response = await character.generateResponse(prompt, this.getRecentContext(game), currentPartyActions);
                    console.log(`${character.name} responded: "${response.substring(0, 50)}..."`);

                    // Add this character's action to the list for subsequent characters
                    partyActions.push(`${character.name}: ${response}`);

                    this.addMessage(gameId, character.name, response, 'character');
                } catch (error) {
                    console.error(`Error getting response from ${character.name}:`, error);
                    const fallbackMessage = `*${character.name} seems speechless*`;
                    partyActions.push(`${character.name}: ${fallbackMessage}`);
                    this.addMessage(gameId, character.name, fallbackMessage, 'character');
                }
            }
        }

        game.currentTurn++;
        console.log(`Turn ${game.currentTurn} completed. Total messages: ${game.messages.length}`);
    }

    addMessage(gameId: string, speaker: string, message: string, type: GameMessage['type']): void {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        const gameMessage: GameMessage = {
            id: crypto.randomUUID(),
            speaker,
            message,
            timestamp: new Date(),
            type
        };

        game.messages.push(gameMessage);
    }

    getGameStatus(gameId: string): GameState | null {
        return this.games.get(gameId) || null;
    }

    getActiveGames(): GameState[] {
        return Array.from(this.games.values()).filter(game => game.isActive);
    }

    private getRecentContext(game: GameState, messageCount: number = 10): string {
        const recentMessages = game.messages.slice(-messageCount);
        return recentMessages
            .map(msg => `${msg.speaker}: ${msg.message}`)
            .join('\n');
    }

    private findAddressedCharacter(prompt: string, characters: Character[]): Character | null {
        const lowerPrompt = prompt.toLowerCase();

        // Check for direct address patterns
        for (const character of characters) {
            const name = character.name.toLowerCase();

            // Patterns that indicate direct address:
            // "Thorin, what do you do?"
            // "Hey Luna, cast a spell"
            // "Can you help us, Gandalf?"
            // "Thorin: roll for initiative"

            const directAddressPatterns = [
                new RegExp(`^${name}[,:]`, 'i'),           // "Name," or "Name:"
                new RegExp(`\\b${name}[,:]\\s`, 'i'),      // "Name, " or "Name: "
                new RegExp(`^(hey|hi)\\s+${name}\\b`, 'i'), // "Hey Name"
                new RegExp(`\\b${name}\\s*,\\s*what`, 'i'), // "Name, what"
                new RegExp(`\\b${name}\\s*,\\s*can`, 'i'),  // "Name, can"
                new RegExp(`\\b${name}\\s*,\\s*do`, 'i'),   // "Name, do"
                new RegExp(`\\b${name}\\s*,\\s*roll`, 'i'), // "Name, roll"
                new RegExp(`\\b${name}\\s*,\\s*cast`, 'i'), // "Name, cast"
                new RegExp(`\\b${name}\\s*,\\s*use`, 'i'),  // "Name, use"
            ];

            if (directAddressPatterns.some(pattern => pattern.test(lowerPrompt))) {
                return character;
            }
        }

        return null;
    }

    endGame(gameId: string): void {
        const game = this.games.get(gameId);
        if (game) {
            game.isActive = false;
        }
    }

    // Method to get messages for WebSocket streaming
    getMessages(gameId: string): GameMessage[] {
        const game = this.games.get(gameId);
        return game ? game.messages : [];
    }

    // Method to get LLM provider status
    getLLMStatus(): object {
        return this.llmProvider.getStatus();
    }
}
