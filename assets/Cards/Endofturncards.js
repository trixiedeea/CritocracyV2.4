/**
 * End of Turn Cards Module
 * Contains all end-of-turn cards that affect players at the end of each turn
 */

/**
 * Factory function to create an End of Turn card with the standard layout
 */
export const createEndOfTurnCard = (cardData) => ({
    ...cardData,
    type: 'END_OF_TURN',
    layout: 'monopoly-style'
});

// Factory functions for different card categories
export const createHistoricalSpacesCard = (name, description, effects) => (
    createEndOfTurnCard({ name, description, effects })
);

export const createCulturalCard = (name, description, effects) => (
    createEndOfTurnCard({ name, description, effects })
);

export const createTechnologyCard = (name, description, effects) => (
    createEndOfTurnCard({ name, description, effects })
);

export const createSocialMovementCard = (name, description, effects) => (
    createEndOfTurnCard({ name, description, effects })
);

export const createIdentityCard = (name, description, effects) => (
    createEndOfTurnCard({ name, description, effects })
);

export const createEnvironmentalCard = (name, description, effects) => (
    createEndOfTurnCard({ name, description, effects })
);

// Array of end-of-turn card definitions
export const ENDOFTURNCARDS = [
    createHistoricalSpacesCard(
        "The Reclamation of Historical Spaces",
        "Historical sites and artifacts are reclaimed by formerly colonized peoples. Césaire argues for the importance of reclaiming cultural heritage, while Benjamin notes how this disrupts the 'continuum of history' constructed by the victors.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -3, influence: -4 }, explanation: "Your museums face repatriation claims." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 4, influence: 3 }, explanation: "You assist in the return of cultural artifacts." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: 5, influence: 1 }, explanation: "You document the movement for cultural reclamation." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -3, knowledge: -1, influence: -2 }, explanation: "Tourism to your colonial heritage sites decreases." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -2, influence: -3 }, explanation: "You face pressure to return stolen cultural treasures." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 3, influence: 4 }, explanation: "Your work highlighting reclaimed cultural spaces gains recognition." }
        }
    ),
    createHistoricalSpacesCard(
        "The Rise of Historical Revisionism",
        "Historical revisionism emerges as a dominant force in shaping current ideologies. Barthes suggests that all texts are open to reinterpretation, while Césaire emphasizes the revision of colonial narratives.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: 5, knowledge: 2, influence: -3 }, explanation: "Revisionism bolsters your finances but costs influence." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -3, influence: 1 }, explanation: "Fighting revisionism is costly and difficult." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 5, influence: -2 }, explanation: "Intense study yields knowledge but attracts criticism." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: 4, knowledge: 1, influence: -1 }, explanation: "Capitalizing on revisionism has financial rewards and risks." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -3, influence: 6 }, explanation: "Manipulating narratives boosts influence significantly." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: 3, influence: -4 }, explanation: "Your critical art struggles against revisionist trends." }
        }
    ),
    createTechnologyCard(
        "Digital Archives and the Battle for History",
        "Digital archives democratize access to history, but also raise questions about who controls these records. Benjamin's theory on technological reproducibility highlights the impact of mass media in reshaping art and history.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -3, knowledge: 1, influence: -4 }, explanation: "Loss of narrative control impacts influence and finances." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 3, influence: 3 }, explanation: "Digital tools aid organization and spread knowledge." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 4, influence: 1 }, explanation: "Curating digital archives brings recognition and some funding." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -1, influence: 3 }, explanation: "Competition forces adaptation, offering new influence avenues." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -2, influence: -2 }, explanation: "Lack of control over digital records proves challenging." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 2, influence: 5 }, explanation: "Digital platforms amplify your artistic reach." }
        }
    ),
    createHistoricalSpacesCard(
        "Colonial Monuments and the Battle for Public Memory",
        "The debate around the removal or preservation of colonial monuments escalates. Césaire calls for the rejection of symbols that perpetuate colonial dominance.",
        {
            Colonialist: { type: 'RESOURCE_CHANGE', changes: { money: -6, knowledge: -2, influence: -2 }, explanation: "You are forced to protect colonial monuments at great expense." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 1, influence: 6 }, explanation: "You lead protests that demand the removal of colonial symbols." },
            Historian: { type: 'RESOURCE_CHANGE', changes: { money: 0, knowledge: 5, influence: 1 }, explanation: "You research the history of colonial monuments." },
            Entrepreneur: { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -1, influence: -2 }, explanation: "You face financial fallout from your association with colonial symbols." },
            Politician: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 0, influence: 5 }, explanation: "You pass legislation to protect colonial monuments." },
            Artist: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 2, influence: 6 }, explanation: "Your work advocates for the removal of colonial monuments." }
        }
    ),
    createSocialMovementCard(
        "Social Media Debates on Colonial Legacies",
        "Social media becomes a battleground for debates about colonialism and its legacies. Benjamin's critique of historical narrative and Barthes' notion of authorship become central to the conversation.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -3, knowledge: -3, influence: -5 }, explanation: "Public backlash against your role in colonial history spreads on social media." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 3, knowledge: 2, influence: 5 }, explanation: "Your voice is amplified on digital platforms." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 5, influence: 1 }, explanation: "You document the heated debates around colonial legacies." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: 0, influence: -2 }, explanation: "Your business faces a boycott due to its association with colonial history." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: -2, influence: 4 }, explanation: "You take advantage of social media to promote your policies." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 3, influence: 5 }, explanation: "Your work provokes thought on colonial legacies on social media." }
        }
    ),
    createHistoricalSpacesCard(
        "Historians vs. Victims of History",
        "The historian's role in interpreting history is contested. Benjamin's 'Angel of History' is caught in the winds of progress, unable to change the past, while Césaire demands that history be reinterpreted from the perspectives of the oppressed.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -1, influence: -2 }, explanation: "You can't control the narrative as effectively." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 4, influence: 2 }, explanation: "Your arguments resonate in the contest over historical interpretation." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -5, influence: 1 }, explanation: "You are caught in the crossfire between the victims and the perpetrators." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -3, knowledge: -2, influence: 1 }, explanation: "You lose clients who favor the reinterpretation of history." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 1, influence: 4 }, explanation: "You ally with historians to shape the narrative in your favor." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 2, influence: 3 }, explanation: "Your art supports the voice of the oppressed." }
        }
    ),
    createCulturalCard(
        "Repatriation of Cultural Artifacts",
        "The call for the return of looted cultural artifacts from colonial powers gains traction. Césaire and Tuck & Yang advocate for reparations that include cultural restitution.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -6, knowledge: -3, influence: -2 }, explanation: "You are forced to return cultural artifacts, reducing your wealth." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 3, influence: 5 }, explanation: "Your activism drives the push for reparations." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 5, influence: 2 }, explanation: "You contribute to the academic discourse on repatriation." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -2, influence: -1 }, explanation: "Your profits decline as demand for stolen artifacts wanes." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 3, knowledge: 1, influence: 4 }, explanation: "You oversee the repatriation process and gain political capital." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 2, influence: 5 }, explanation: "Your work supports the call for cultural repatriation." }
        }
    ),
    createTechnologyCard(
        "Artificial Intelligence and the Question of Identity",
        "AI challenges traditional notions of identity, as algorithms start to shape perceptions of gender and race. Butler's theory of performative identity and Mulvey's concept of the male gaze are essential for understanding how these technologies might reinforce or subvert social norms.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: -3, influence: -4 }, explanation: "AI is used to challenge colonial ideologies." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: 5, influence: 2 }, explanation: "You study AI's impact on identity formation." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 3, influence: -1 }, explanation: "You document the intersection of AI and identity." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: 5, knowledge: 2, influence: 1 }, explanation: "You capitalize on the growing AI industry." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -3, influence: -3 }, explanation: "AI challenges your control over the political landscape." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 1, influence: 4 }, explanation: "You critique the role of AI in shaping cultural narratives." }
        }
    ),
    createSocialMovementCard(
        "The Globalization of Resistance",
        "Global movements for justice and decolonization intersect, transcending national borders. Tuck & Yang stress that decolonization is a process, not just a metaphor, and Benjamin's 'Angel of History' observes the international nature of resistance.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -3, influence: -4 }, explanation: "Your global influence is weakened by rising resistance." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 4, knowledge: 4, influence: 5 }, explanation: "Your international alliances strengthen your cause." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 5, influence: 2 }, explanation: "You document the rise of transnational resistance." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -1, influence: -2 }, explanation: "Global instability threatens your business." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 3, knowledge: -1, influence: 5 }, explanation: "You align with international powers to suppress revolts." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 3, influence: 4 }, explanation: "Your art spreads the message of global solidarity." }
        }
    ),
    createIdentityCard(
        "Gender and the Performance of Power",
        "Gender as a social performance intersects with power dynamics. Butler's theory of gender performativity is applied to how power is exercised through gendered performances, while Césaire critiques the colonial systems that reinforced gender norms.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -1, influence: -4 }, explanation: "You are caught in a backlash against patriarchal colonial systems." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 4, influence: 3 }, explanation: "You adopt gender as a revolutionary tool." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 0, knowledge: 4, influence: 1 }, explanation: "You analyze the gendered power dynamics in colonial history." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -3, knowledge: -2, influence: 0 }, explanation: "Your gendered advertising strategies are criticized." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: -2, influence: 5 }, explanation: "You use gender politics to consolidate power." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 3, influence: 4 }, explanation: "Your work critiques the performance of gendered power." }
        }
    ),
    createHistoricalSpacesCard(
        "The Spectacle of Colonial Violence",
        "The spectacle of colonial violence, captured in media, is revisited. Benjamin's idea of the historical 'spectacle' forces a reconsideration of colonial violence and its ongoing impact.",
        {
            Colonialist: { type: 'RESOURCE_CHANGE', changes: { money: -3, knowledge: -2, influence: -6 }, explanation: "Your actions are exposed and criticized for their violence." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 6, influence: 4 }, explanation: "You expose the violence as a tool for resistance." },
            Historian: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 5, influence: 1 }, explanation: "You document the ongoing impact of colonial violence." },
            Entrepreneur: { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -1, influence: -2 }, explanation: "You are targeted for profiteering from violence." },
            Politician: { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -1, influence: 5 }, explanation: "You use the spectacle to manipulate public opinion." },
            Artist: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 3, influence: 7 }, explanation: "Your art sparks a public outcry over colonial violence." }
        }
    ),
    createSocialMovementCard(
        "The Rise of Neo-Colonialism",
        "Neo-colonialism rises as multinational corporations and political structures continue to dominate formerly colonized nations. Césaire's critique of economic exploitation and Tuck & Yang's ideas about decolonization are at the heart of this phenomenon.",
        {
            Colonialist: { type: 'RESOURCE_CHANGE', changes: { money: 7, knowledge: 2, influence: 3 }, explanation: "You benefit from economic domination in a neo-colonial system." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -3, influence: -5 }, explanation: "Your resistance is hindered by neo-colonial systems." },
            Historian: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 6, influence: 0 }, explanation: "You analyze the rise of neo-colonialism in modern contexts." },
            Entrepreneur: { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -2, influence: -2 }, explanation: "You face backlash against neo-colonial business practices." },
            Politician: { type: 'RESOURCE_CHANGE', changes: { money: 3, knowledge: 1, influence: 6 }, explanation: "You implement policies that support neo-colonial interests." },
            Artist: { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -1, influence: -5 }, explanation: "Your critique is marginalized in the face of neo-colonial power." }
        }
    ),
    createIdentityCard(
        "The Rise of Queer Theories",
        "Queer theory emerges as a powerful critique of normative structures. Sedgwick's exploration of queer identity and Butler's theory of gender as performative action challenge conventional ideas about gender and sexuality.",
        {
            Colonialist: { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -3, influence: -6 }, explanation: "Your patriarchal system is challenged by queer theories." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 6, influence: 4 }, explanation: "You incorporate queer theory into your resistance movements." },
            Historian: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 5, influence: 1 }, explanation: "You document the influence of queer theory on modern struggles." },
            Entrepreneur: { type: 'RESOURCE_CHANGE', changes: { money: 7, knowledge: 1, influence: 3 }, explanation: "You profit from the emerging demand for queer-inclusive products." },
            Politician: { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -2, influence: 5 }, explanation: "You use queer theory to connect with marginalized groups." },
            Artist: { type: 'RESOURCE_CHANGE', changes: { money: 3, knowledge: 4, influence: 6 }, explanation: "Your art incorporates and critiques normative gender roles." }
        }
    ),
    createSocialMovementCard(
        "Revolutionary Movements and the State's Reaction",
        "Revolutionary movements are met with increasing repression. Benjamin's critique of state violence and Césaire's call for anti-colonial resistance highlight the tension between revolutionary acts and state control.",
        {
            Colonialist: { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -2, influence: -1 }, explanation: "You are forced to fund counterinsurgency efforts." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: 2, influence: 6 }, explanation: "Your movement grows despite state repression." },
            Historian: { type: 'RESOURCE_CHANGE', changes: { money: 0, knowledge: 5, influence: 1 }, explanation: "You document the state's response to revolutionary movements." },
            Entrepreneur: { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -1, influence: -2 }, explanation: "Your business is targeted by revolutionary movements." },
            Politician: { type: 'RESOURCE_CHANGE', changes: { money: 3, knowledge: -1, influence: 7 }, explanation: "You use repression to suppress revolutionaries." },
            Artist: { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: 2, influence: 6 }, explanation: "Your art inspires revolutionary movements." }
        }
    ),
    createCulturalCard(
        "The Ethics of Representation in Postcolonial Art",
        "Postcolonial artists grapple with representing their identities within a Western framework. Césaire calls for a reclamation of representation, while Mulvey critiques the ways in which Western cinema constructs the 'Other.'",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -2, influence: -1 }, explanation: "Your depictions of the 'Other' are now widely criticized." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 2, influence: 5 }, explanation: "Your postcolonial art inspires resistance." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: 4, influence: 1 }, explanation: "You analyze the ethical implications of art in postcolonial contexts." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -2, influence: 1 }, explanation: "You lose clients who are alienated by postcolonial art." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -1, influence: -3 }, explanation: "Your propaganda is challenged by critical art." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 1, influence: 4 }, explanation: "You gain recognition for your postcolonial critique." }
        }
    ),
    createCulturalCard(
        "Neocolonial Media and the Reproduction of Ideology",
        "Media, particularly film and television, is used to reproduce colonial ideologies. Benjamin's theory of the technological reproducibility of art and Barthes' concept of authorship highlight the role of media in shaping public perception.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 2, influence: 4 }, explanation: "You control the media and continue to shape colonial narratives." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -1, influence: -3 }, explanation: "Your message is overshadowed by dominant media ideologies." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 0, knowledge: 4, influence: 1 }, explanation: "You study the role of media in perpetuating colonial ideologies." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: 3, knowledge: 1, influence: 1 }, explanation: "You capitalize on media that supports colonial narratives." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: -1, influence: 4 }, explanation: "You manipulate media to further your political agenda." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -2, influence: -4 }, explanation: "Your critiques of media representation are ignored." }
        }
    ),
    createCulturalCard(
        "The Colonial Gaze in Popular Cinema",
        "The colonial gaze persists in contemporary media, objectifying and infantilizing colonized peoples. Mulvey's concept of the male gaze and Césaire's critique of colonial objectification intersect in the film industry's portrayal of the colonized.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 1, influence: 3 }, explanation: "You continue to profit from the colonial gaze in media." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -2, influence: -4 }, explanation: "Your critiques of the gaze are overshadowed by popular media." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 4, influence: 0 }, explanation: "You analyze the colonial gaze in historical and modern cinema." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -1, influence: -2 }, explanation: "You face a backlash from consumers demanding decolonized media." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: -1, influence: 4 }, explanation: "You exploit media to reinforce the colonial gaze." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 2, influence: 4 }, explanation: "Your work critiques and challenges colonial representation in media." }
        }
    ),
    createTechnologyCard(
        "Technology and the Commodification of History",
        "Technology transforms how history is recorded and remembered. Benjamin critiques the technological reproduction of history, which reduces it to a commodity.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -3, influence: -3 }, explanation: "The commodification of history exposes your narratives as false." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 4, influence: 2 }, explanation: "You leverage technology to spread alternative histories." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: 3, influence: 1 }, explanation: "You document the commodification of historical memory." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: 4, knowledge: 1, influence: 1 }, explanation: "You profit from the demand for digital history." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -2, influence: -3 }, explanation: "Your manipulation of historical memory is exposed." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 2, influence: 3 }, explanation: "Your art critiques the commodification of history." }
        }
    ),
    createHistoricalSpacesCard(
        "The Politics of Memory in Postcolonial Societies",
        "Memory is a powerful tool in postcolonial societies. Tuck & Yang emphasize the importance of how the past is remembered and reclaimed in decolonization, while Césaire calls for the erasure of colonial memory.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -1, influence: -2 }, explanation: "You face resistance from movements reclaiming history." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 2, influence: 5 }, explanation: "Your movement thrives by controlling memory." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 3, influence: 1 }, explanation: "You contribute to memory studies in postcolonial contexts." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -2, influence: -1 }, explanation: "Your business is boycotted for perpetuating colonial memory." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: -1, influence: 3 }, explanation: "You use memory politics to maintain power." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 1, influence: 4 }, explanation: "Your work reclaims and reshapes historical memory." }
        }
    ),
    createIdentityCard(
        "The Performance of Identity in Digital Spaces",
        "Digital platforms become stages for identity performance. Butler's theory of performativity and Sedgwick's work on queer identity provide insights into how online identities are constructed and contested.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -2, knowledge: -1, influence: -3 }, explanation: "Digital spaces challenge your identity construction." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 4, influence: 2 }, explanation: "You use digital platforms for identity performance." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 0, knowledge: 4, influence: 1 }, explanation: "You study digital identity construction." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: 4, knowledge: 1, influence: 1 }, explanation: "You capitalize on digital identity trends." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -2, influence: -4 }, explanation: "Digital identities challenge your control." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 1, influence: 4 }, explanation: "Your art explores digital identity performance." }
        }
    ),
    createTechnologyCard(
        "Technological Surveillance and Historical Control",
        "Surveillance technology impacts how history is controlled and contested. Benjamin's critique of historical narratives and Césaire's analysis of colonial control intersect in debates about technology and power.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -3, knowledge: -2, influence: -2 }, explanation: "Your movement is suppressed by surveillance." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: -1, influence: -5 }, explanation: "Your movement is suppressed by surveillance." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 4, influence: 1 }, explanation: "You analyze the role of technology in historical control." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -1, influence: -2 }, explanation: "You face backlash against surveillance technologies." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: -1, influence: 5 }, explanation: "You use surveillance to maintain power." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -1, influence: -4 }, explanation: "Your art critiques surveillance culture." }
        }
    ),
    createSocialMovementCard(
        "Global Networks of Resistance",
        "Decolonization is not just a local or national effort but a global struggle. Tuck and Yang highlight the importance of international solidarity in dismantling colonial structures.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -1, influence: -3 }, explanation: "Global resistance movements drain your resources." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 2, influence: 5 }, explanation: "You unite global movements under a common cause." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: 4, influence: 1 }, explanation: "You study global networks and their resistance strategies." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -1, influence: -2 }, explanation: "Your business suffers as global resistance boycotts your products." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 1, influence: 3 }, explanation: "Your diplomatic ties help stabilize the global situation." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 2, influence: 4 }, explanation: "Your artwork spreads the message of global resistance." }
        }
    ),
    createHistoricalSpacesCard(
        "History is Written by the Victors",
        "The narrative of history is shaped by those who hold power. Barthes and Benjamin challenge the idea that history is impartial or fixed, proposing that it is always a product of power dynamics.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: 4, knowledge: 2, influence: 1 }, explanation: "You continue to benefit from the dominant historical narrative." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -5, influence: -2 }, explanation: "The dominant narrative suppresses your efforts." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 5, influence: -1 }, explanation: "You uncover the hidden histories of the oppressed." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -4, knowledge: -1, influence: -2 }, explanation: "Your company profits from the dominant but morally questionable history." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -3, influence: -4 }, explanation: "The public questions your role in shaping historical narratives." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 1, knowledge: 2, influence: 3 }, explanation: "You produce works that challenge the dominant historical perspective." }
        }
    ),
    createCulturalCard(
        "The Rejection of the Colonial Past",
        "Césaire highlights the psychological and social trauma left by colonial rule. This rejection of the colonial past signifies a collective turning point where societies reclaim their identities and question the imposed systems of power.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { money: -6, knowledge: -2, influence: -1 }, explanation: "The societal rejection of your legacy erodes your wealth." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 1, influence: 5 }, explanation: "Your call for liberation is gaining more support." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: 5, influence: 1 }, explanation: "You now record the collective resistance against colonialism." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: -5, knowledge: -1, influence: -1 }, explanation: "Your colonial ventures are devalued in the market." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { money: -1, knowledge: -2, influence: -4 }, explanation: "Your power is challenged by the rejection of colonialism." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { money: 2, knowledge: 2, influence: 6 }, explanation: "Your artistic interpretation becomes a symbol of postcolonial identity." }
        }
    ),
    createCulturalCard(
        "The Rise of Postcolonial Literature",
        "As writers from formerly colonized countries gain prominence, their works become vehicles for reinterpreting history and identity. Barthes' idea of the death of the author is evident as these new voices challenge established literary canons.",
        {
            Colonialist:   { type: 'RESOURCE_CHANGE', changes: { influence: -5 }, explanation: "Your Colonialist narratives are increasingly disregarded." },
            Revolutionary: { type: 'RESOURCE_CHANGE', changes: { knowledge: 7 }, explanation: "You study and propagate postcolonial literary works." },
            Historian:     { type: 'RESOURCE_CHANGE', changes: { knowledge: 5 }, explanation: "You now have access to a rich body of postcolonial literature." },
            Entrepreneur:  { type: 'RESOURCE_CHANGE', changes: { money: 6 }, explanation: "You profit from the growing interest in postcolonial literature." },
            Politician:    { type: 'RESOURCE_CHANGE', changes: { influence: -5 }, explanation: "You struggle to silence new postcolonial voices." },
            Artist:        { type: 'RESOURCE_CHANGE', changes: { influence: 6 }, explanation: "Your art is inspired by the new postcolonial literary movements." }
        }
    ),
];

// Format the cards with the card layout
const formattedEndOfTurnCards = ENDOFTURNCARDS.map(card => createEndOfTurnCard(card));

// Export the cards as default export
export default formattedEndOfTurnCards;
