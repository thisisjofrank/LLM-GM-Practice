// Example D&D Scenarios for Testing
// Use these prompts to test different types of adventures

export const scenarios = {
    classic: [
        "You find yourselves in the Prancing Pony tavern when a hooded stranger approaches your table with a mysterious map. What do you do?",
        "A dragon has been terrorizing the village of Greenhold. The mayor offers 1000 gold pieces for its defeat. How do you prepare?",
        "You discover an ancient dungeon entrance hidden behind a waterfall. Strange lights flicker from within. Do you enter?",
        "Your party awakens in a dark forest with no memory of how you got there. In the distance, you hear wolves howling. What's your first action?"
    ],

    roleplay: [
        "You arrive at a grand ball where nobles whisper of political intrigue and a missing heir to the throne. How do you gather information?",
        "Your party must negotiate a peace treaty between two warring goblin tribes who speak different languages. What's your approach?",
        "A magical plague has turned the townspeople into animals. You must find the cure before sunset. Where do you start?",
        "You encounter a group of bandits, but they claim to be Robin Hood-style heroes. How do you determine the truth?"
    ],

    combat: [
        "Orcs ambush your party on the mountain pass! They're charging with weapons drawn. What do you do?",
        "A massive troll blocks the bridge ahead, demanding a toll of 100 gold pieces or a fight to the death. How do you respond?",
        "The necromancer's skeleton army rises from the graveyard as you approach the cursed cathedral. What's your battle plan?",
        "A gelatinous cube oozes around the corner in the dungeon corridor, blocking your escape route. How do you react?"
    ], mystery: [
        "The innkeeper has been murdered, and all the guests are suspects. You must find the killer before dawn.",
        "Children have been disappearing from the village. The only clue is strange music heard at midnight.",
        "Your party finds a room where time moves differently - some areas age you, others make you younger.",
        "A merchant's caravan has vanished on the road. You find only strange tracks that seem to float in mid-air."
    ],

    humorous: [
        "You encounter a group of very polite zombies who insist on having tea before any combat begins.",
        "A wizard's spell has gone wrong, turning all the furniture in the castle into tiny aggressive dogs.",
        "Your party must infiltrate a cooking competition to stop an evil chef from poisoning the king.",
        "A mimic has taken the form of the entire tavern. Everyone inside is very confused about why the walls keep giggling."
    ],

    epic: [
        "The ancient seal containing the Demon Lord has begun to crack. You have 7 days to prevent the apocalypse.",
        "Reality itself is unraveling as different planes of existence begin to merge. Up is down, fire freezes, and the dead return to life.",
        "The gods have gone silent. Divine magic fails worldwide, and chaos spreads across the realms.",
        "You discover that your entire world is actually inside a snow globe on a giant's shelf, and the giant is getting ready to shake it."
    ]
};

// Utility function to get a random scenario
export function getRandomScenario(type: keyof typeof scenarios = 'classic'): string {
    const scenarioList = scenarios[type];
    return scenarioList[Math.floor(Math.random() * scenarioList.length)];
}

// Get all scenario types
export function getScenarioTypes(): string[] {
    return Object.keys(scenarios);
}
