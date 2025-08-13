import { assertEquals, assertExists } from "@std/assert";
import { GameManager } from "./src/game/GameManager.ts";
import { Character } from "./src/game/Character.ts";
import { LLMProvider } from "./src/llm/LLMProvider.ts";

Deno.test("GameManager - Create new game", async () => {
  const gameManager = new GameManager();

  const characters = [
    { name: "TestHero", class: "Fighter", personality: "Brave test character" }
  ];

  const gameId = await gameManager.startNewGame("Test scenario", characters);

  assertExists(gameId);
  assertEquals(typeof gameId, "string");

  const gameStatus = gameManager.getGameStatus(gameId);
  assertExists(gameStatus);
  assertEquals(gameStatus.isActive, true);
  assertEquals(gameStatus.characters.length, 1);
});

Deno.test("Character - Generate introduction", async () => {
  const llmProvider = new LLMProvider({ provider: 'mock' });
  const character = new Character("TestHero", "Fighter", "Brave and loyal", llmProvider);

  const intro = await character.generateIntroduction("You are in a tavern");

  assertExists(intro);
  assertEquals(typeof intro, "string");
});

Deno.test("LLMProvider - Mock responses", async () => {
  const llmProvider = new LLMProvider({ provider: 'mock' });

  const response = await llmProvider.generateResponse("Test prompt");

  assertExists(response);
  assertEquals(typeof response, "string");
});

Deno.test("GameManager - Process GM prompt", async () => {
  const gameManager = new GameManager();

  const characters = [
    { name: "TestHero", class: "Fighter", personality: "Brave test character" }
  ];

  const gameId = await gameManager.startNewGame("Initial scenario", characters);

  await gameManager.processGMPrompt(gameId, "A dragon appears!");

  const gameStatus = gameManager.getGameStatus(gameId);
  assertExists(gameStatus);

  // Should have initial messages plus GM prompt and character response
  assertEquals(gameStatus.messages.length >= 3, true);
});
