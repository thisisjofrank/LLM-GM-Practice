# Deployment Configuration for Deno Deploy

## Environment Variables

Set these in your Deno Deploy project settings:

### Required
- None (the app works with mock responses by default)

### Optional (for real LLM integration)
- `OPENAI_API_KEY` - Your OpenAI API key for GPT models
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude models

## Deploy Command

Entry point: `main.ts`

## Automatic Deployment

This project is configured for automatic deployment from your main branch.

## Manual Deployment

```bash
# Using Deno Deploy CLI
deployctl deploy --project=your-project-name main.ts

# Or push to your connected GitHub repository
git push origin main
```

## Performance Notes

- The application uses Deno's built-in WebSocket support
- Static assets are served efficiently 
- Mock responses provide instant feedback during development
- Real LLM calls are cached where possible
