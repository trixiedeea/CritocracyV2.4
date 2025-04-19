// Special Event cards for Critocracy
// These cards are drawn when landing on special event spaces

// ===== Card Factory Functions =====

/**
 * Factory function to create an Age of Expansion (Purple) card
 */
export const createAgeOfExpansionCard = (card) => ({
    name: card.name,
    description: card.description,
    layout: {
        width: "2.5 inches",
        height: "3.5 inches",
        borderColor: "#9C54DE", // Purple border
        backgroundColor: "#9C54DE", // Purple background
        textColor: "black", // Black font
        fontStyle: "bold",
        alignment: "center",
        padding: "10px",
        fontSize: "14px"
    },
    effects: card.effects
});

/**
 * Factory function to create an Age of Resistance (Blue) card
 */
export const createAgeOfResistanceCard = (card) => ({
    name: card.name,
    description: card.description,
    layout: {
        width: "2.5 inches",
        height: "3.5 inches",
        borderColor: "#1B3DE5", // Blue border
        backgroundColor: "#1B3DE5", // Blue background
        textColor: "black", // Black font
        fontStyle: "bold",
        alignment: "center",
        padding: "10px",
        fontSize: "14px"
    },
    effects: card.effects
});

/**
 * Factory function to create an Age of Reckoning (Cyan) card
 */
export const createAgeOfReckoningCard = (card) => ({
    name: card.name,
    description: card.description,
    layout: {
        width: "2.5 inches",
        height: "3.5 inches",
        borderColor: "#00FFFF", // Cyan border
        backgroundColor: "#00FFFF", // Cyan background
        textColor: "black", // Black font
        fontStyle: "bold",
        alignment: "center",
        padding: "10px",
        fontSize: "14px"
    },
    effects: card.effects
});

/**
 * Factory function to create an Age of Legacy (Pink) card
 */
export const createAgeOfLegacyCard = (card) => ({
    name: card.name,
    description: card.description,
    layout: {
        width: "2.5 inches",
        height: "3.5 inches",
        borderColor: "#FF66FF", // Pink border
        backgroundColor: "#FF66FF", // Pink background
        textColor: "black", // Black font
        fontStyle: "bold",
        alignment: "center",
        padding: "10px",
        fontSize: "14px"
    },
    effects: card.effects
});

// ===== Card Collections =====

// Age of Expansion (Purple) cards
const ageOfExpansionCards = [
    {
        name: "Scramble for Africa",
        description: "Reflects Discourse on Colonialism by highlighting the violent race for African resources, rewarding Money but costing Influence due to growing resistance.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { money: 6 } },
            { type: 'RESOURCE_CHANGE', changes: { influence: -5 } }
        ]
    },
    {
        name: "Divide and Conquer",
        description: "Mirrors Césaire's critique of colonial strategies used to fracture societies, advancing players but diminishing their critical understanding.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 7 },
            { type: 'RESOURCE_CHANGE', changes: { knowledge: -5 } }
        ]
    },
    {
        name: "Exploitation Justified",
        description: "Embodies Césaire's analysis of colonial rationalization, increasing wealth at the cost of moral legitimacy.",
        effects: [
            { type: 'STEAL', target: 'OTHER', resource: 'money', amount: 6 }, 
            { type: 'RESOURCE_CHANGE', changes: { influence: -5 } }
        ]
    },
    {
        name: "Colonial Enterprise",
        description: "Reflects Césaire's critique of colonial economic ventures that prioritized profit over justice, allowing financial gain but risking alliances.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { money: -6, knowledge: 5 } } 
        ]
    },
    {
        name: "Missionary Influence",
        description: "Represents Césaire's view of ideological domination through religion, granting Influence but reinforcing colonial authority.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 6 },
            { type: 'RESOURCE_CHANGE', changes: { influence: 5 } }
        ]
    },
    {
        name: "Revolt Suppression",
        description: "Demonstrates colonial violence used to crush uprisings, allowing sabotage but increasing instability.",
        effects: [
            { type: 'MOVEMENT', target: 'OTHER', spaces: -6 } 
        ]
    },
    {
        name: "Commodification of Labor",
        description: "Reflects Césaire's analysis of forced labor systems, allowing Money gain at the expense of future opportunities.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { money: 7 } },
            { type: 'SKIP_TURN', target: 'SELF' }
        ]
    },
    {
        name: "Indigenous Displacement",
        description: "Reflects Césaire's warning about the violence of land dispossession, advancing progress but reducing moral standing.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', moveToAge: "The Age of Resistance" }, 
            { type: 'RESOURCE_CHANGE', changes: { influence: -6 } }
        ]
    },
    {
        name: "Control the Narrative",
        description: "Embodies colonial propaganda described by Césaire, increasing Knowledge while reinforcing power.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 5 } },
            { type: 'MOVEMENT', target: 'SELF', spaces: 5 }
        ]
    },
    {
        name: "Mercantile Expansion",
        description: "Highlights colonial capitalism's expansion, fostering temporary alliances but encouraging unequal trade.",
        effects: [
            { type: 'ALLIANCE_OFFER' }, 
            { type: 'TRADE_OFFER' } 
        ]
    },
    {
        name: "Plantation Economy",
        description: "Reflects Césaire's critique of exploitative plantation economies, rewarding Money but hindering intellectual growth.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: -5 } },
            { type: 'RESOURCE_CHANGE', changes: { money: 6 } }
        ]
    },
    {
        name: "Imperial Propaganda",
        description: "Reinforces colonial dominance through narrative control, allowing suppression of opposition.",
        effects: [
            { type: 'SABOTAGE', target: 'OTHER', changes: { influence: -4 } }
        ]
    }
];

// Age of Resistance (Blue) cards
const ageOfResistanceCards = [
    {
        name: "Haitian Revolution",
        description: "Reflects Benjamin's Angel of History by showcasing the reversal of colonial power, rewarding Influence and progress.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 7 },
            { type: 'RESOURCE_CHANGE', changes: { influence: 5 } }
        ]
    },
    {
        name: "Salt March",
        description: "Embodies nonviolent resistance, advancing the cause but risking political fallout.",
        effects: [
            { type: 'STEAL', target: 'OTHER', resource: 'money', amount: 5 }, 
            { type: 'RESOURCE_CHANGE', changes: { influence: -5 } }
        ]
    },
    {
        name: "Print to Power",
        description: "Echoes Benjamin's belief in media's role in empowering resistance, allowing Knowledge gain and strategic movement.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 6 } },
            { type: 'MOVEMENT', target: 'SELF', spaces: 6 }
        ]
    },
    {
        name: "Anti-Colonial Uprising",
        description: "Reflects Benjamin's view of history's ruptures, advancing players but at the cost of resources.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', moveToAge: "The Age of Reckoning" },
            { type: 'RESOURCE_CHANGE', changes: { money: -6 } }
        ]
    },
    {
        name: "Subaltern Voices",
        description: "Draws on postcolonial theory's focus on marginalized voices, increasing Knowledge but disrupting existing power.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 5 } },
            { type: 'MOVEMENT', target: 'OTHER', spaces: -5 }
        ]
    },
    {
        name: "Angel of History",
        description: "Embodies Benjamin's idea that progress is built on past suffering, pushing players backward while rewarding reflection.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: -6 },
            { type: 'RESOURCE_CHANGE', changes: { influence: 6 } }
        ]
    },
    {
        name: "Decolonial Theory",
        description: "Reflects Tuck and Yang's call for real material change, allowing alliances and resource exchange.",
        effects: [
            { type: 'ALLIANCE_OFFER' },
            { type: 'TRADE_OFFER' } 
        ]
    },
    {
        name: "Disrupting Power Structures",
        description: "Mirrors Barthes' Death of the Author, shifting control by trading Influence for Knowledge.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { influence: -5, knowledge: 6 } }
        ]
    },
    {
        name: "Narrative Shift",
        description: "Reflects Benjamin's idea of history's reversals, allowing players to reshape their paths.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 5 },
            { type: 'DRAW_CARD', deckType: 'END_OF_TURN' } 
        ]
    },
    {
        name: "Revolutionary Momentum",
        description: "Embodies Benjamin's recognition of historical upheaval, enabling sabotage of opponents.",
        effects: [
            { type: 'MOVEMENT', target: 'OTHER', spaces: -7 } 
        ]
    },
    {
        name: "Counter-Hegemony",
        effects: [
            { type: 'TRADE_OFFER' } 
        ]
    },
    {
        name: "Intellectual Awakening",
        description: "Reflects Benjamin's call for critical engagement with history, giving players the power to strategically reposition.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 5 } },
            { type: 'MOVEMENT', target: 'SELF', spaces: 4 }
        ]
    }
];

// Age of Reckoning (Cyan) cards
const ageOfReckoningCards = [
    {
        name: "End of Apartheid",
        description: "Reflects Barthes' Death of the Author, allowing narrative shifts that increase Influence and progress.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 6 },
            { type: 'RESOURCE_CHANGE', changes: { influence: 6 } }
        ]
    },
    {
        name: "Museum Artifact Repatriation",
        description: "Embodies Tuck and Yang's insistence on real restitution, enabling resource exchange.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { money: -5, influence: 6 } } 
        ]
    },
    {
        name: "The Death of the Author",
        description: "Inspired by Barthes' work, challenging authorship and enabling Knowledge gain.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: -5 },
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 5 } }
        ]
    },
    {
        name: "Postcolonial Critique",
        description: "Reflects Barthes' advocacy for multiple interpretations, advancing players while weakening opponents.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 7 },
            { type: 'SABOTAGE', target: 'OTHER', changes: { influence: -5 } }
        ]
    },
    {
        name: "Decolonization Is Not a Metaphor",
        description: "Reflects Tuck and Yang's demand for action, enabling sabotage to ensure real change.",
        effects: [
            { type: 'STEAL', target: 'OTHER', resource: 'random', amount: 5 }
        ]
    },
    {
        name: "Queer and Now",
        description: "Draws on Sedgwick's destabilization of normativity, allowing repositioning for strategic advantage.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 5 }
        ]
    },
    {
        name: "Performative Acts",
        description: "Reflects Butler's theory of gender as performance, enabling positional swaps that challenge identity norms.",
        effects: [
            { type: 'MOVEMENT', target: 'OTHER', spaces: -5 }
        ]
    },
    {
        name: "Visual Pleasure and Narrative",
        description: "Inspired by Mulvey's critique of cinematic narratives, advancing players while disrupting knowledge structures.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 6 } },
            { type: 'MOVEMENT', target: 'SELF', spaces: -6 }
        ]
    },
    {
        name: "Solidarity Networks",
        description: "Highlights alliances formed during decolonization, fostering collaboration.",
        effects: [
            { type: 'ALLIANCE_OFFER' },
            { type: 'RESOURCE_CHANGE', changes: { influence: 5 } }
        ]
    },
    {
        name: "Reparations Now",
        description: "Demands material reparations for historical injustices, allowing resource transfer.",
        effects: [
            { type: 'STEAL_FROM_ALL', resource: 'money', amount: 3 }
        ]
    },
    {
        name: "Critical Historiography",
        description: "Challenges dominant historical narratives, rewarding critical Knowledge.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 7 } },
            { type: 'SABOTAGE', target: 'OTHER', changes: { knowledge: -3 } }
        ]
    },
    {
        name: "Reclaiming Spaces",
        description: "Focuses on taking back physical and symbolic spaces, enabling movement.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 8 },
            { type: 'RESOURCE_CHANGE', changes: { influence: 3 } }
        ]
    }
];

// Age of Legacy (Pink) cards
const ageOfLegacyCards = [
    {
        name: "Digital Divide",
        description: "Exposes inequalities in access to digital history, impacting Knowledge.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: -7 } }, // Self loss
            { type: 'SABOTAGE', target: 'OTHER', changes: { knowledge: -4 } } // Others lose less
        ]
    },
    {
        name: "Memory Laws",
        description: "Highlights state control over historical narratives, penalizing certain interpretations.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { influence: -6 } }
        ]
    },
    {
        name: "Archival Silences",
        description: "Reveals gaps in historical records, pushing players back as they reinvestigate.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: -7 },
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 4 } }
        ]
    },
    {
        name: "Historical Trauma",
        description: "Addresses the lasting impact of past injustices, costing resources.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { money: -6, influence: -3 } }
        ]
    },
    {
        name: "Victors Write History",
        description: "Reinforces dominant narratives, rewarding players aligned with power.",
        // How to determine alignment? Placeholder: give resources
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { money: 5, influence: 5 } }
        ]
    },
    {
        name: "Counter-Narratives Emerge",
        description: "Challenges established histories, allowing strategic gains.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 6 } },
            { type: 'MOVEMENT', target: 'OTHER', spaces: -4 } // disrupt others
        ]
    },
    {
        name: "Public History Debates",
        description: "Sparks public debate about historical interpretation, affecting Influence.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { influence: 7 } },
            { type: 'SABOTAGE', target: 'OTHER', changes: { influence: -4 } }
        ]
    },
    {
        name: "Legacy of Resistance",
        description: "Honors past struggles, providing resources and inspiration.",
        effects: [
            { type: 'MOVEMENT', target: 'SELF', spaces: 6 },
            { type: 'RESOURCE_CHANGE', changes: { knowledge: 3, influence: 3 } }
        ]
    },
    {
        name: "Generational Amnesia",
        description: "Highlights the loss of historical memory, penalizing Knowledge.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { knowledge: -8 } }
        ]
    },
    {
        name: "Future Histories",
        description: "Considers how current actions will be remembered, rewarding forward thinking.",
        // Placeholder: Grant immunity?
        effects: [
            { type: 'GRANT_IMMUNITY', turns: 1 } 
        ]
    },
    {
        name: "Rewriting the Past",
        description: "Allows players to alter historical narratives, gaining Influence but losing Knowledge.",
        effects: [
            { type: 'RESOURCE_CHANGE', changes: { influence: 8, knowledge: -5 } }
        ]
    },
    {
        name: "The Weight of History",
        description: "Shows the burden of the past, slowing progress.",
        effects: [
            { type: 'SKIP_TURN', target: 'SELF' },
            { type: 'RESOURCE_CHANGE', changes: { money: -4 } }
        ]
    }
];

// Format cards using their respective factory functions
export const PURPLE_CARDS = ageOfExpansionCards.map(card => createAgeOfExpansionCard(card));
export const BLUE_CARDS = ageOfResistanceCards.map(card => createAgeOfResistanceCard(card));
export const CYAN_CARDS = ageOfReckoningCards.map(card => createAgeOfReckoningCard(card));
export const PINK_CARDS = ageOfLegacyCards.map(card => createAgeOfLegacyCard(card));