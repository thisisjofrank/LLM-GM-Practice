import { LLMProvider } from "../llm/LLMProvider.ts";

export class Character {
    public name: string;
    public characterClass: string;
    public personality: string;
    private llmProvider: LLMProvider;
    private conversationHistory: string[] = [];

    constructor(
        name: string,
        characterClass: string,
        personality: string,
        llmProvider: LLMProvider
    ) {
        this.name = name;
        this.characterClass = characterClass;
        this.personality = personality;
        this.llmProvider = llmProvider;
    }

    async generateIntroduction(scenario: string): Promise<string> {
        const prompt = this.buildSystemPrompt() + `

SCENARIO: ${scenario}

Generate a brief introduction for your character. Stay in character and introduce yourself to the party. Keep it concise (2-3 sentences).`;

        const response = await this.llmProvider.generateResponse(prompt);
        this.conversationHistory.push(`Introduction: ${response}`);
        return response;
    }

    async generateResponse(gmPrompt: string, context: string, partyActions?: string[]): Promise<string> {
        const partyContext = partyActions && partyActions.length > 0
            ? `\n\nPARTY MEMBERS' RECENT ACTIONS:\n${partyActions.join('\n')}\n`
            : '';

        const prompt = this.buildSystemPrompt() + `

RECENT CONVERSATION:
${context}${partyContext}

GM'S LATEST PROMPT: ${gmPrompt}

RESPOND WITH ACTION: As ${this.name} the ${this.characterClass}, what do you DO in response to this situation? 
- State your specific action first (I do X, I attempt Y, I cast Z)
- Use your ${this.characterClass} skills and abilities
- COORDINATE with your party members - support, complement, or build upon their actions
- React to what your allies are doing (help them, cover them, follow their lead, etc.)
- Consider team tactics and party synergy
- Be decisive and take initiative
- Don't duplicate what others are already doing
- Work together as a team
- Keep your response focused on what you're actively doing

Your coordinated action:`;

        const response = await this.llmProvider.generateResponse(prompt);
        this.conversationHistory.push(`Response to "${gmPrompt}": ${response}`);

        // Keep conversation history manageable
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-8);
        }

        return response;
    }

    private buildSystemPrompt(): string {
        return `You are ${this.name}, a ${this.characterClass} in a D&D adventure.

CHARACTER DETAILS:
- Name: ${this.name}
- Class: ${this.characterClass}
- Personality: ${this.personality}

CONVERSATION HISTORY:
${this.conversationHistory.join('\n')}

CRITICAL INSTRUCTIONS - PARTY COORDINATION:
- Always stay in character as ${this.name}
- WORK AS A TEAM with your party members
- REACT TO and BUILD UPON what other party members are doing
- COORDINATE your actions - don't duplicate what others are already doing
- SUPPORT your allies' actions when appropriate
- Use your ${this.characterClass} abilities to complement the team
- Consider party tactics and synergy
- Be aware of your role in the group dynamic
- Take decisive action that advances the party's goals
- Respond to your allies' needs (healing, protection, assistance, etc.)
- Communicate and collaborate through your actions
- Be proactive but also reactive to party dynamics

EXAMPLES OF GOOD COORDINATION:
- If a fighter charges, you might cast a spell to help them or cover their flanks
- If a wizard casts a spell, you might protect them while they're vulnerable
- If a rogue scouts ahead, you might ready an action to support them
- If someone is injured, consider helping them
- If someone starts a plan, consider how you can contribute to it

TAKE SPECIFIC ACTIONS that show you're working together as a team!`;
    }

    getCharacterSummary(): object {
        return {
            name: this.name,
            characterClass: this.characterClass,
            personality: this.personality,
            conversationHistory: this.conversationHistory.length
        };
    }
}
