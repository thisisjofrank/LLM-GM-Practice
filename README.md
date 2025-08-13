# LLM 🎲 GM Practice

A Deno-powered web application that demonstrates how to use an LLMs in your Deno project.

## Quick Start

### Prerequisites

- [Deno](https://deno.com/) installed on your system
- API keys for [OpenAI](https://openai.com/) or [Anthropic](https://www.anthropic.com/) for real LLM responses

### Local Development

1. **Clone and setup**:
   ```bash
   cd your-project-directory
   ```

2. **Set up environment variables** (optional):
   ```bash
   # For real LLM responses, set one of these:
   export OPENAI_API_KEY="your-openai-key-here"
   # OR
   export ANTHROPIC_API_KEY="your-anthropic-key-here"
   ```

3. **Run the development server**:
   ```bash
   deno task dev
   ```

4. **Open your browser** to `http://localhost:8000`

## How to Play

1. **Start a New Game**: Enter a scenario in the GM prompt box
2. **Watch the Magic**: AI characters will introduce themselves
3. **Guide the Adventure**: Add new prompts as the GM
4. **Enjoy the Story**: Watch as characters interact and respond creatively

### Example Scenarios

- *"You find yourselves in a tavern when a mysterious hooded figure approaches your table..."*
- *"A dragon has been terrorizing the nearby village. The mayor offers a reward for its defeat."*
- *"You discover an ancient dungeon entrance hidden behind a waterfall."*

## Project Structure

```sh
├── main.ts                 # Main server entry point
├── deno.json              # Deno configuration
├── src/
│   ├── game/
│   │   ├── GameManager.ts  # Core game logic
│   │   └── Character.ts    # AI character implementation
│   ├── llm/
│   │   └── LLMProvider.ts  # LLM integration layer
│   └── server/
│       └── WebSocketHandler.ts # Real-time communication
└── static/
    └── index.html         # Web interface (embedded)
```

## LLM Configuration

The application supports multiple LLM providers:

### Mock Mode (Default)
- No API keys required
- Great for testing and demonstrations
- Provides contextual responses based on character personalities

### OpenAI Integration
```typescript
// Set environment variable
export OPENAI_API_KEY="your-key-here"
```

### Anthropic Integration
```typescript
// Set environment variable
export ANTHROPIC_API_KEY="your-key-here"
```

## Deployment to Deno Deploy

1. **Prepare your project**:
   ```bash
   # Ensure all dependencies are properly configured in deno.json
   ```

2. **Deploy to Deno Deploy**:
   - Push your code to GitHub
   - Connect your repository to [Deno Deploy](https://dash.deno.com/)
   - Set environment variables in the Deno Deploy dashboard
   - Deploy with entry point: `main.ts`

3. **Set Environment Variables** in Deno Deploy dashboard:
   - `OPENAI_API_KEY` (if using OpenAI)
   - `ANTHROPIC_API_KEY` (if using Anthropic)

## Default Characters

The application comes with three pre-configured characters:

- **Tharin** (Fighter): Brave and loyal, always ready to protect allies
- **Lyra** (Wizard): Curious and analytical, loves solving puzzles  
- **Finn** (Rogue): Witty and sneaky, prefers clever solutions

## Development Commands

```bash
# Start development server with file watching
deno task dev

# Start production server
deno task start

# Run tests
deno task test

# Type check
deno check main.ts
```

## Customization

### Adding New Characters

Modify the character configuration in `main.ts`:

```typescript
characters: [
  { name: "YourCharacter", class: "YourClass", personality: "Your personality description" },
  // ... more characters
]
```

### Changing LLM Behavior

Edit the system prompts in `Character.ts` to adjust how characters respond.

### Styling the Interface

The HTML interface is embedded in `main.ts` - customize the CSS for your preferred look.

## API Endpoints

- `GET /` - Web interface
- `POST /api/game/start` - Start a new game
- `GET /api/game/status?gameId={id}` - Get game status
- `WebSocket /ws` - Real-time game communication

## Example Usage

```typescript
// Starting a new game
const response = await fetch('/api/game/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gmPrompt: "You enter a mysterious forest...",
    characters: [
      { name: "Hero", class: "Paladin", personality: "Noble and just" }
    ]
  })
});
```

## Contributing

This project demonstrates modern Deno development practices:

- TypeScript throughout
- Standard library usage
- WebSocket real-time communication
- Modular architecture
- Cloud deployment ready

Feel free to extend it with:
- More LLM providers
- Enhanced character AI
- Persistent game storage
- Multi-room support
- Voice integration

## 📜 License

This project is open source and available under the MIT License.

---

Built with ❤️ and Deno for the modern web!
