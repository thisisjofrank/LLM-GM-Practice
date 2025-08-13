// LLM Provider for integrating with various AI models
// This implementation includes OpenAI, but can be extended for other providers

export interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'mock';
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

export class LLMProvider {
    private config: LLMConfig;
    private rateLimitedUntil: number = 0; // Timestamp when rate limit expires
    private retryCount: number = 0;
    private maxRetries: number = 3;

    constructor(config?: Partial<LLMConfig>) {
        const apiKey = config?.apiKey || Deno.env.get('OPENAI_API_KEY') || Deno.env.get('ANTHROPIC_API_KEY');

        // Auto-detect provider based on available API keys if not specified
        let provider = config?.provider;
        if (!provider && apiKey) {
            if (Deno.env.get('OPENAI_API_KEY')) {
                provider = 'openai';
            } else if (Deno.env.get('ANTHROPIC_API_KEY')) {
                provider = 'anthropic';
            }
        }

        this.config = {
            provider: provider || 'mock', // Default to mock only if no API key
            model: 'gpt-3.5-turbo',
            maxTokens: 150,
            temperature: 0.8,
            ...config,
            apiKey
        };

        console.log(`LLM Provider initialized: ${this.config.provider} (API Key: ${apiKey ? 'present' : 'missing'})`);
    }

    async generateResponse(prompt: string): Promise<string> {
        console.log(`Generating response using ${this.config.provider} provider...`);

        // Check if we're temporarily rate limited
        if (this.rateLimitedUntil > Date.now()) {
            console.warn('Temporarily using mock responses due to rate limiting');
            return this.mockResponse(prompt);
        }

        switch (this.config.provider) {
            case 'openai':
                return await this.callOpenAI(prompt);
            case 'anthropic':
                return await this.callAnthropic(prompt);
            case 'mock':
            default:
                return this.mockResponse(prompt);
        }
    } private async callOpenAI(prompt: string): Promise<string> {
        if (!this.config.apiKey) {
            console.warn('No OpenAI API key found, falling back to mock responses');
            return this.mockResponse(prompt);
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`OpenAI API error: ${response.status} - ${errorText}`);

                // Handle specific error codes
                if (response.status === 429) {
                    const retryAfter = response.headers.get('retry-after');
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 1 minute
                    this.rateLimitedUntil = Date.now() + waitTime;
                    console.warn(`OpenAI rate limit exceeded, using mock responses for ${waitTime / 1000} seconds`);
                } else if (response.status === 401) {
                    console.warn('OpenAI API key invalid, falling back to mock responses');
                } else if (response.status >= 500) {
                    console.warn('OpenAI server error, falling back to mock responses');
                } else {
                    console.warn(`OpenAI API error ${response.status}, falling back to mock responses`);
                }

                return this.mockResponse(prompt);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || 'No response generated';
        } catch (error) {
            console.error('OpenAI API network error:', error);
            console.warn('Falling back to mock responses due to network error');
            return this.mockResponse(prompt);
        }
    }

    private async callAnthropic(prompt: string): Promise<string> {
        if (!this.config.apiKey) {
            console.warn('No Anthropic API key found, falling back to mock responses');
            return this.mockResponse(prompt);
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: this.config.maxTokens,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: this.config.temperature,
                }),
            });

            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.status}`);
            }

            const data = await response.json();
            return data.content[0]?.text || 'No response generated';
        } catch (error) {
            console.error('Anthropic API error:', error);
            return this.mockResponse(prompt);
        }
    }

    private mockResponse(prompt: string): string {
        // Extract character details from prompt for more contextual responses
        const nameMatch = prompt.match(/You are (\w+),/);
        const classMatch = prompt.match(/Class: (\w+)/);
        const characterName = nameMatch?.[1] || 'Character';
        const characterClass = classMatch?.[1] || 'Adventurer';

        // Check if there are party actions to react to
        const hasPartyActions = prompt.includes('PARTY MEMBERS\' RECENT ACTIONS:');

        // Generate contextual mock responses based on character and prompt content
        const mockResponses = {
            introduction: [
                `I stride forward confidently and introduce myself: "Greetings! I am ${characterName}, a ${characterClass}. I'm ready for adventure!"`,
                `I step up to the group and extend my hand: "Well met! ${characterName} at your service. My ${characterClass.toLowerCase()} skills are yours to command."`,
                `I approach with a friendly smile: "Hello there! I'm ${characterName}. Let's see what adventures await us together!"`
            ],
            combat: hasPartyActions ? [
                `I coordinate with my allies, moving to support their attack while striking at the enemy's weak points!`,
                `I cast a spell to enhance my party members' abilities, then ready my weapon for battle!`,
                `I position myself to protect my allies while they execute their plans, keeping watch for threats!`,
                `I follow up on my ally's attack, combining our efforts to overwhelm the enemy!`,
                `I cover my party members' flanks while they engage, ensuring no enemy escapes!`
            ] : [
                `I draw my weapon and charge toward the nearest enemy, shouting a battle cry!`,
                `I cast a spell at the approaching foe, channeling my ${characterClass.toLowerCase()} power!`,
                `I move to protect my allies and ready my defenses against the incoming attack!`,
                `I attempt to flank the enemy, using my ${characterClass.toLowerCase()} training to find their weak spot!`,
                `I leap into action, striking with precision and determination!`
            ],
            exploration: hasPartyActions ? [
                `I work with my allies to thoroughly search the area, covering ground they haven't checked yet.`,
                `I support my party member's investigation by watching for danger while they examine the details.`,
                `I coordinate with my allies to map out the area efficiently, each taking a different section.`,
                `I follow up on what my ally discovered, building on their findings with my own expertise.`,
                `I position myself to guard my party while they investigate, ready to alert them of any threats.`
            ] : [
                `I carefully examine the area, searching for traps, hidden passages, or valuable clues.`,
                `I move ahead to scout the path, keeping my senses alert for any dangers.`,
                `I investigate the strange markings on the wall, trying to decipher their meaning.`,
                `I test the floor ahead with my weapon before proceeding cautiously forward.`,
                `I check for secret doors by running my hands along the stone walls.`
            ],
            social: hasPartyActions ? [
                `I support my ally's approach by standing ready to back up their words with action.`,
                `I build on what my party member said, adding my own perspective to strengthen our position.`,
                `I watch my ally's back while they negotiate, ready to step in if things go badly.`,
                `I complement my party member's strategy by taking a different diplomatic angle.`,
                `I follow my ally's lead, supporting their negotiation with my own skills.`
            ] : [
                `I step forward and attempt to negotiate peacefully with them.`,
                `I try to charm them with my words, hoping to avoid conflict.`,
                `I offer them a deal that could benefit us both.`,
                `I listen carefully to their demands and consider our options.`,
                `I attempt to intimidate them into backing down.`
            ],
            magic: [
                `I cast a spell to help our situation, focusing my magical energy!`,
                `I prepare an enchantment that might give us an advantage.`,
                `I channel my arcane power to create a magical effect.`,
                `I weave a spell with careful precision, hoping it will work.`
            ],
            stealth: [
                `I attempt to sneak around behind them, moving as quietly as possible.`,
                `I try to pick the lock on the door while staying hidden.`,
                `I move through the shadows, avoiding detection.`,
                `I carefully disable the trap I've discovered.`
            ],
            default: [
                `I take action immediately, using my ${characterClass.toLowerCase()} skills to help the party.`,
                `I step forward and do what needs to be done in this situation.`,
                `I act quickly, drawing on my training and experience.`,
                `I take the initiative and make a bold move to advance our goals.`,
                `I spring into action, ready to face whatever challenge this presents.`
            ]
        };

        // Determine response type based on prompt content and character class
        let responseType = 'default';
        if (prompt.toLowerCase().includes('introduction') || prompt.toLowerCase().includes('introduce')) {
            responseType = 'introduction';
        } else if (prompt.toLowerCase().includes('combat') || prompt.toLowerCase().includes('fight') || prompt.toLowerCase().includes('battle') || prompt.toLowerCase().includes('attack')) {
            responseType = 'combat';
        } else if (prompt.toLowerCase().includes('explore') || prompt.toLowerCase().includes('search') || prompt.toLowerCase().includes('investigate') || prompt.toLowerCase().includes('examine')) {
            responseType = 'exploration';
        } else if (prompt.toLowerCase().includes('talk') || prompt.toLowerCase().includes('negotiate') || prompt.toLowerCase().includes('persuade') || prompt.toLowerCase().includes('diplomacy')) {
            responseType = 'social';
        } else if ((characterClass.toLowerCase().includes('wizard') || characterClass.toLowerCase().includes('sorcerer') || characterClass.toLowerCase().includes('cleric')) &&
            (prompt.toLowerCase().includes('spell') || prompt.toLowerCase().includes('magic'))) {
            responseType = 'magic';
        } else if ((characterClass.toLowerCase().includes('rogue') || characterClass.toLowerCase().includes('thief')) &&
            (prompt.toLowerCase().includes('sneak') || prompt.toLowerCase().includes('hide') || prompt.toLowerCase().includes('lock'))) {
            responseType = 'stealth';
        }

        const responses = mockResponses[responseType as keyof typeof mockResponses];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Method to update configuration (useful for switching providers)
    updateConfig(newConfig: Partial<LLMConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    // Method to check if real LLM is available
    isRealLLMAvailable(): boolean {
        return this.config.provider !== 'mock' && !!this.config.apiKey && this.rateLimitedUntil <= Date.now();
    }

    // Method to get current status
    getStatus(): { provider: string; available: boolean; rateLimitedUntil?: number } {
        return {
            provider: this.config.provider,
            available: this.isRealLLMAvailable(),
            rateLimitedUntil: this.rateLimitedUntil > Date.now() ? this.rateLimitedUntil : undefined
        };
    }

    // Method to reset rate limiting (for manual override)
    resetRateLimit(): void {
        this.rateLimitedUntil = 0;
        console.log('Rate limit manually reset');
    }
}
