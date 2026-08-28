import type { Character } from '../../engine/types';

/**
 * Roster — 47 results.
 *
 * AUTHORING RULES (all machine-enforced by `npm run audit -- harry-potter`):
 *
 * 1. Every character needs at least TWO axes at or below -35. Negative space is the
 *    strongest predictor of a character who can actually win: a roster of people who are
 *    somewhat everything produces one generalist who wins every quiz.
 * 2. Populate the off-diagonal deliberately — devoted-and-exacting (Snape, Bellatrix),
 *    detached-and-merciful (Firenze, Ollivander), ordered-and-defiant (Grindelwald,
 *    McGonagall) — or the space collapses into a good/evil proxy and the correlation gate
 *    catches it.
 * 3. No pair above 0.90 cosine.
 * 4. `desiredShare` convention: ~2.2 for the common and beloved, ~1.4 for a main, ~0.55 for
 *    a deliberate rarity. The calibrator solves per-character gravity to hit these.
 *
 * `region` carries the Hogwarts house. It is roster QA and result colour ONLY — it is never
 * read by the scoring engine, and no question may name a house (the four house names are on
 * this pack's DENY list). Sorting the taker is the *output*, so putting a house in a
 * question would be handing them the answer key.
 */

/** Positional, so a mis-ordered vector is a compile error rather than a silent wrong result. */
const v = (
	precept: number,
	candour: number,
	attachment: number,
	defiance: number,
	reckoning: number,
	ambition: number,
	temper: number
) => ({ precept, candour, attachment, defiance, reckoning, ambition, temper });

export const CHARACTERS: Character[] = [
	// ---------------------------------------------------------------- gryffindor
	{
		id: 'harry',
		name: 'Harry Potter',
		epithet: 'The One Who Goes',
		region: 'gryffindor',
		desiredShare: 1.58,
		era: ['second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(-45, 35, 85, 85, -50, 20, 55),
		blurb:
			'You go, and you work out the plan on the way. What decides it is never the argument — it is that someone you know is at the other end of it, and nobody else has left yet.',
		strength: 'You move while everyone else is still establishing what is true.',
		blindspot: 'You mistake being the one who goes for being the one who has to.'
	},
	{
		id: 'hermione',
		name: 'Hermione Granger',
		epithet: 'The One Who Read Ahead',
		region: 'gryffindor',
		desiredShare: 0.46,
		era: ['second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(90, 65, 70, -40, 35, 85, -55),
		blurb:
			'You did the reading, and the reading is why it works. You would rather be told you are insufferable than watch a preventable thing happen to people you like.',
		strength: 'You have already found the answer while the room is still describing the problem.',
		blindspot:
			'You trust the institution longer than it earns, because the institution is where the rules live.'
	},
	{
		id: 'ron',
		name: 'Ron Weasley',
		epithet: 'The One Who Stayed',
		region: 'gryffindor',
		desiredShare: 1.8,
		era: ['second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(-40, 70, 85, 25, 30, -50, 80),
		blurb:
			'You say the thing out loud, including the unflattering version, and you are still there afterwards. You have left once and it is the worst thing you ever did.',
		strength: 'People say true things near you, because you said the awkward one first.',
		blindspot: 'You measure yourself against the person beside you and always come second.'
	},
	{
		id: 'neville',
		name: 'Neville Longbottom',
		epithet: 'The Late Arrival',
		region: 'gryffindor',
		desiredShare: 1.27,
		era: ['second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(20, 35, 80, 60, -55, -40, -20),
		blurb:
			'You were not the one anybody was watching, and then the room needed someone and you were already standing. You keep the grudge nowhere; there is no room for it.',
		strength: 'You are steadier at the end of a bad year than you were at the start.',
		blindspot: 'You wait to be needed rather than deciding you are.'
	},
	{
		id: 'ginny',
		name: 'Ginny Weasley',
		epithet: 'The Straight Answer',
		region: 'gryffindor',
		desiredShare: 1.52,
		era: ['second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(-45, 80, 30, 65, -40, 50, 65),
		blurb:
			'You say it flatly and early, and if that costs you the room, the room was going to cost you more later. It goes off fast and it is over fast; you do not keep a ledger on anybody.',
		strength: 'Nobody has to guess where they stand with you.',
		blindspot: 'You settle things fast, which is not the same as settling them.'
	},
	{
		id: 'sirius',
		name: 'Sirius Black',
		epithet: 'The Unfinished Sentence',
		region: 'gryffindor',
		desiredShare: 2.0,
		era: ['first-war', 'second-war'],
		debut: { title: 'Prisoner of Azkaban', year: 1999 },
		vector: v(-75, 45, 85, 90, 70, -45, 80),
		blurb:
			'You picked your people over the ones you were born to, and you have never once been sorry. What you have not done is stop keeping score against everyone who was on the other side.',
		strength: 'You will burn a bridge that everyone else keeps crossing out of habit.',
		blindspot: 'You are still fighting a war that ended, against people who have aged out of it.'
	},
	{
		id: 'lupin',
		name: 'Remus Lupin',
		epithet: 'The Careful One',
		region: 'gryffindor',
		desiredShare: 1.61,
		era: ['first-war', 'second-war'],
		debut: { title: 'Prisoner of Azkaban', year: 1999 },
		vector: v(45, -55, 70, -30, -65, -50, -70),
		blurb:
			'You are the calmest person in the room and the one keeping the most back. You forgive early and quietly, partly because you are certain you will need it yourself.',
		strength: 'You can teach a frightened person something while they are still frightened.',
		blindspot: 'Your restraint reads as agreement, and you let it, right up until it is too late.'
	},
	{
		id: 'mcgonagall',
		name: 'Minerva McGonagall',
		epithet: 'The Straight Back',
		region: 'gryffindor',
		desiredShare: 0.82,
		era: ['staff'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(90, 60, 55, 40, 50, -40, -55),
		blurb:
			'You do it properly, you say so plainly, and when the proper channel is captured you go around it without raising your voice. The rules are yours; you are not theirs.',
		strength: 'You can refuse an order and stay entirely within your own standards.',
		blindspot: 'You hold everyone to a bar you set for yourself and never explained.'
	},
	{
		id: 'molly',
		name: 'Molly Weasley',
		epithet: 'The Full Table',
		region: 'gryffindor',
		desiredShare: 0.74,
		era: ['first-war', 'second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(10, 80, 95, -45, 25, -65, 80),
		blurb:
			'You feed people and you fuss and you say exactly what you think of their choices. Come for one of yours and you will find out how little of that was softness.',
		strength: 'Everyone knows there is one place they can arrive at without warning.',
		blindspot: 'You worry loudly at people who needed you to be quietly certain.'
	},
	{
		id: 'fred',
		name: 'Fred Weasley',
		epithet: 'The Better Idea',
		region: 'gryffindor',
		desiredShare: 0.7,
		era: ['second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(-85, 75, 45, 70, -60, 70, -45),
		eclipses: ['tonks'],
		blurb:
			'You have never once done it the way it was laid out, and the thing you built instead works and makes money. You do not hold anything against anyone for long; it is boring.',
		strength: 'You find the route nobody costed because nobody thought it was a route.',
		blindspot: 'You turn the serious moment into a joke because you got there first and it was easier.'
	},
	{
		id: 'percy',
		name: 'Percy Weasley',
		epithet: 'The Correct Procedure',
		region: 'gryffindor',
		desiredShare: 1.48,
		era: ['ministry'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(95, -20, -55, -85, 5, 85, -55),
		blurb:
			'You did everything the way you were told it should be done, and you were promoted for it, and it cost you the table you grew up at. You still think the process was right.',
		strength: 'The thing you are responsible for is never the thing that fails.',
		blindspot: 'You mistook the institution for the people who told you to trust it.'
	},
	{
		id: 'dumbledore',
		name: 'Albus Dumbledore',
		epithet: 'The Longer Game',
		region: 'gryffindor',
		desiredShare: 1.38,
		era: ['staff', 'first-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(70, -85, 60, 55, -60, 65, -75),
		eclipses: ['grindelwald'],
		blurb:
			'You are kind, you are patient, and you are telling almost nobody almost anything. You forgive the person in front of you while quietly moving them into position.',
		strength: 'You are three moves further along than the conversation you are having.',
		blindspot:
			'You decide what people can carry without asking them, and call the withholding mercy.'
	},
	{
		id: 'hagrid',
		name: 'Rubeus Hagrid',
		epithet: 'The Open Door',
		region: 'gryffindor',
		desiredShare: 0.5,
		era: ['staff'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(-60, 90, 85, -45, -70, -75, 60),
		blurb:
			'Everything you feel arrives on your face before you have decided to send it. You want what you already have, you like what nobody else likes, and you keep no accounts at all.',
		strength: 'Nothing frightening stays frightening once you have introduced it properly.',
		blindspot: 'You cannot hold a secret, and people keep handing you theirs anyway.'
	},

	// ---------------------------------------------------------------- slytherin
	{
		id: 'snape',
		name: 'Severus Snape',
		epithet: 'The Long Debt',
		region: 'slytherin',
		desiredShare: 0.32,
		era: ['staff', 'first-war', 'second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(75, -90, 65, 45, 85, 55, -60),
		blurb:
			'You are keeping the largest secret in the room and paying for something nobody has been told about. The devotion is total; so is the ledger you keep on everyone else.',
		strength: 'You can hold a position for twenty years with no audience and no credit.',
		blindspot:
			'You take it out on whoever is nearest and least able to have deserved it.'
	},
	{
		id: 'draco',
		name: 'Draco Malfoy',
		epithet: 'The Inherited Position',
		region: 'slytherin',
		desiredShare: 0.71,
		era: ['second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(30, -40, 55, -55, 60, 70, 60),
		blurb:
			'You were handed a side before you could evaluate it, and you have been performing certainty about it ever since. The performance is loud because underneath it you are not certain at all.',
		strength: 'You know exactly what your people expect, and you can deliver it on cue.',
		blindspot: 'You have never separated what you want from what was assigned to you.'
	},
	{
		id: 'voldemort',
		name: 'Lord Voldemort',
		epithet: 'The One Who Would Not Stop',
		region: 'slytherin',
		desiredShare: 0.79,
		era: ['first-war', 'second-war'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(65, -70, -95, 85, 95, 95, 40),
		blurb:
			'You want more, permanently, and you have never met a person you could not spend. Every debt gets collected, at the time that suits you, from whoever is still holding it.',
		strength: 'Nothing you decide is ever slowed down by who it costs.',
		blindspot: 'You cannot model a person who would give something up, so they keep beating you.'
	},
	{
		id: 'bellatrix',
		name: 'Bellatrix Lestrange',
		epithet: 'The Devoted Blade',
		region: 'slytherin',
		desiredShare: 0.97,
		era: ['first-war', 'second-war'],
		debut: { title: 'Goblet of Fire', year: 2000 },
		vector: v(-55, 80, 85, -60, 95, 60, 95),
		blurb:
			'You gave yourself entirely to one person and everything left over is edge. You say precisely what you mean, immediately, and you collect every debt in full and in person.',
		strength: 'Your commitment has no conditions attached and never wavers.',
		blindspot: 'You handed your judgment to someone else and called it faith.'
	},
	{
		id: 'lucius',
		name: 'Lucius Malfoy',
		epithet: 'The Standing Arrangement',
		region: 'slytherin',
		desiredShare: 0.53,
		era: ['first-war', 'ministry'],
		debut: { title: 'Chamber of Secrets', year: 1998 },
		vector: v(70, -60, 40, -50, 65, 85, -45),
		blurb:
			'You keep the correct relationships in the correct order and you have paid for all of them. When it goes wrong you discover the arrangements were holding you, not the other way round.',
		strength: 'You always know who owes what, and to whom, and how recently.',
		blindspot: 'You bought position instead of building it, and it can be repossessed.'
	},
	{
		id: 'narcissa',
		name: 'Narcissa Malfoy',
		epithet: 'The One Who Lied Last',
		region: 'slytherin',
		desiredShare: 0.84,
		era: ['second-war'],
		debut: { title: 'Goblet of Fire', year: 2000 },
		vector: v(30, -70, 95, 20, -15, 0, -60),
		blurb:
			'You said almost nothing for years, and then you told the largest lie of the war to the most dangerous man alive, for one reason. The reason was never the cause.',
		strength: 'You will do the unforgivable thing quietly and never mention it again.',
		blindspot: 'Your circle is one family wide, and everyone outside it is weather.'
	},
	{
		id: 'regulus',
		name: 'Regulus Black',
		epithet: 'The Quiet Reversal',
		region: 'slytherin',
		desiredShare: 0.9,
		era: ['first-war'],
		debut: { title: 'Half-Blood Prince', year: 2005 },
		vector: v(60, -85, 65, 65, -45, -25, -65),
		blurb:
			'You believed it, and then you saw one thing clearly, and you turned around without announcing it to anybody. Nobody knew for eighteen years what you had done.',
		strength: 'You can change your mind completely without needing anyone to watch.',
		blindspot: 'You told no one, so the correction died with you and had to be made twice.'
	},
	{
		id: 'slughorn',
		name: 'Horace Slughorn',
		epithet: 'The Useful Acquaintance',
		region: 'slytherin',
		desiredShare: 1.04,
		era: ['staff'],
		debut: { title: 'Half-Blood Prince', year: 2005 },
		vector: v(55, -50, 20, -80, -65, 85, -35),
		blurb:
			'You collect promising people and you are genuinely warm to all of them, and you would rather not be asked to do anything difficult about it. You hold nothing against anybody.',
		strength: 'You can find the one person in any room who is going to matter later.',
		blindspot: 'You keep the version of a story you can live with, and you hide from the rest.'
	},
	{
		id: 'umbridge',
		name: 'Dolores Umbridge',
		epithet: 'The Correct Form',
		region: 'slytherin',
		desiredShare: 0.68,
		era: ['ministry'],
		debut: { title: 'Order of the Phoenix', year: 2003 },
		vector: v(95, -45, -85, -55, 95, 80, -35),
		blurb:
			'Everything you do is in order, on paper, and countersigned. Cruelty routed through a procedure is not cruelty, as far as you are concerned, and you will do it smiling.',
		strength: 'You can make a thing happen entirely through channels nobody can object to.',
		blindspot: 'You mistook having authority over people for being right about them.'
	},
	{
		id: 'andromeda',
		name: 'Andromeda Tonks',
		epithet: 'The One Who Left',
		region: 'slytherin',
		desiredShare: 0.7,
		era: ['first-war', 'second-war'],
		debut: { title: 'Order of the Phoenix', year: 2003 },
		vector: v(-40, -35, 85, 85, -55, 25, -50),
		blurb:
			'You walked out of the family that made you, married the man they told you not to, and never made a speech about it. You wanted a life, not a position, and you got one.',
		strength: 'You can lose everyone you were raised by and still be steady the next morning.',
		blindspot: 'You decided once, and you have never revisited who you cut off.'
	},
	{
		id: 'barty-crouch-jr',
		name: 'Barty Crouch Jr',
		epithet: 'The Perfect Impersonation',
		region: 'slytherin',
		desiredShare: 0.7,
		era: ['first-war', 'second-war'],
		debut: { title: 'Goblet of Fire', year: 2000 },
		vector: v(-40, -55, 80, 70, 85, 70, -45),
		blurb:
			'You gave everything to a cause your father had already sentenced you for, and then you spent a year being someone else, perfectly, out of pure appetite for the finish.',
		strength: 'You can hold a false position for a year without a single slip.',
		blindspot: 'You were owed a father and took the substitute who asked most of you.'
	},

	// ---------------------------------------------------------------- ravenclaw
	{
		id: 'luna',
		name: 'Luna Lovegood',
		epithet: 'The Undisturbed',
		region: 'ravenclaw',
		desiredShare: 0.47,
		era: ['second-war'],
		debut: { title: 'Order of the Phoenix', year: 2003 },
		vector: v(-65, 95, 60, 65, -80, -70, -60),
		blurb:
			'You say the true strange thing in a level voice and you do not mind at all how it lands. The people who took your things get them handed back with no comment attached.',
		strength: "A room's opinion of you has never once changed what you did next.",
		blindspot: 'You are so unbothered that people never learn what they cost you.'
	},
	{
		id: 'cho',
		name: 'Cho Chang',
		epithet: 'The Open Wound',
		region: 'ravenclaw',
		desiredShare: 0.48,
		era: ['second-war'],
		debut: { title: 'Prisoner of Azkaban', year: 1999 },
		vector: v(20, 60, 80, -50, -55, -30, 65),
		blurb:
			'You are still carrying the last thing, in the open, while everyone around you would prefer you had finished. You do not hold it against them and you do not pretend either.',
		strength: 'You will not perform being fine in order to make a room comfortable.',
		blindspot: 'You need the people around you to hold a grief they did not have.'
	},
	{
		id: 'flitwick',
		name: 'Filius Flitwick',
		epithet: 'The Good Teacher',
		region: 'ravenclaw',
		desiredShare: 0.95,
		era: ['staff'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(85, 60, 45, -45, -60, -30, -60),
		blurb:
			'You are precise, cheerful and entirely without side. You will show someone the same thing eleven times, and on the twelfth you are as pleased as they are.',
		strength: 'You make hard things look learnable, which is most of teaching them.',
		blindspot: 'You defer to the building, and the building has been wrong before.'
	},
	{
		id: 'trelawney',
		name: 'Sybill Trelawney',
		epithet: 'The Occasional Truth',
		region: 'ravenclaw',
		desiredShare: 0.73,
		era: ['staff'],
		debut: { title: 'Prisoner of Azkaban', year: 1999 },
		vector: v(-70, 60, -40, -45, -35, 45, 70),
		blurb:
			'You are wrong most of the time, loudly, and you want very much to be taken seriously. Twice in your life you have been more right than anyone else in the building.',
		strength: 'You keep saying it when the room has visibly stopped listening.',
		blindspot: 'You want the authority so badly that you dress up the ordinary days to get it.'
	},
	{
		id: 'quirrell',
		name: 'Quirinus Quirrell',
		epithet: 'The Borrowed Nerve',
		region: 'ravenclaw',
		desiredShare: 1.94,
		era: ['staff'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(45, -95, -75, -80, 15, 65, -55),
		blurb:
			'You built a whole personality out of being harmless, and it worked for a year in a castle full of clever people. What you actually wanted, you wanted enough to hand yourself over for.',
		strength: 'Nobody looks twice at you, which is the entire plan.',
		blindspot: 'You borrowed the nerve you lacked, and the lender took the whole person.'
	},
	{
		id: 'myrtle',
		name: 'Moaning Myrtle',
		epithet: 'The Standing Grievance',
		region: 'ravenclaw',
		desiredShare: 2.0,
		era: ['hogwarts'],
		debut: { title: 'Chamber of Secrets', year: 1998 },
		vector: v(-50, 70, -45, 45, 60, -80, 80),
		blurb:
			'The thing that was done to you is still the most recent thing that happened, and you will describe it to anyone. You want nothing at all except that it be acknowledged.',
		strength: 'You have never once let anyone tidy your version of it away.',
		blindspot: 'You made the injury the whole address, and now nobody visits.'
	},
	{
		id: 'ollivander',
		name: 'Garrick Ollivander',
		epithet: 'The Long Memory',
		region: 'ravenclaw',
		desiredShare: 1.13,
		era: ['staff'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(70, -50, -60, -35, -45, -40, -70),
		blurb:
			'You remember every one, going back decades, and you say almost nothing about what you remember. You are not on a side; you are on the record, and the record is longer than the war.',
		strength: 'You can tell someone a true thing about themselves in one sentence.',
		blindspot: 'You watch, and being a witness has never once been the same as helping.'
	},
	{
		id: 'lockhart',
		name: 'Gilderoy Lockhart',
		epithet: 'The Signed Copy',
		region: 'ravenclaw',
		desiredShare: 0.35,
		era: ['staff'],
		debut: { title: 'Chamber of Secrets', year: 1998 },
		vector: v(-55, 45, -85, -50, -55, 95, -30),
		blurb:
			'You wanted to be known more than you wanted anything to be true, and you were prepared to take the story off whoever had actually lived it. You bear none of them any ill will.',
		strength: 'You can make a room feel it is in the presence of something.',
		blindspot: 'There is no version of you underneath, and you have known that for years.'
	},

	// ---------------------------------------------------------------- hufflepuff
	{
		id: 'cedric',
		name: 'Cedric Diggory',
		epithet: 'The Level Field',
		region: 'hufflepuff',
		desiredShare: 0.5,
		era: ['second-war'],
		debut: { title: 'Prisoner of Azkaban', year: 1999 },
		vector: v(60, 65, 65, -45, -60, 50, -45),
		blurb:
			'You want to win and you want it to have been fair, and if you cannot have both you will hand back the advantage and say so out loud. You are not performing it. It is just what you do.',
		strength: 'You tell your rival the thing that helps them, before you need to.',
		blindspot: 'You assume the game is being played by the rules you are keeping.'
	},
	{
		id: 'tonks',
		name: 'Nymphadora Tonks',
		epithet: 'The Working Version',
		region: 'hufflepuff',
		desiredShare: 0.57,
		era: ['second-war'],
		debut: { title: 'Order of the Phoenix', year: 2003 },
		vector: v(35, 70, 65, 35, -65, -40, 70),
		blurb:
			'You are blunt, you are early, and you are competent in the ten minutes that actually matter. You went where you were told not to and married the man they warned you about.',
		strength: 'You do the unglamorous half of the job before anybody has asked whether you did.',
		blindspot: 'You present it so badly that people check work that did not need checking.'
	},
	{
		id: 'sprout',
		name: 'Pomona Sprout',
		epithet: 'The Growing Season',
		region: 'hufflepuff',
		desiredShare: 0.88,
		era: ['staff'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(40, 35, 75, -55, -75, -70, -45),
		blurb:
			'You do the work in order, at the right time of year, and it comes up. You want nothing further, you forgive almost immediately, and you are absolutely not to be pushed around.',
		strength: 'The slow, dull, correct thing you did in March is what saves it in June.',
		blindspot: 'You wait for the season, and some things needed doing out of season.'
	},
	{
		id: 'newt',
		name: 'Newt Scamander',
		epithet: 'The Careful Hands',
		region: 'hufflepuff',
		desiredShare: 1.21,
		era: ['first-war'],
		debut: { title: 'Fantastic Beasts', year: 2001 },
		vector: v(-45, -50, 70, 45, -85, -55, -65),
		blurb:
			'You would rather deal with a frightened creature than a committee, and you are correct about which is more dangerous. You have never once wanted the thing to be punished.',
		strength: 'You assume the frightening thing is frightened, and you are usually right.',
		blindspot: 'You would rather manage a beast than say a difficult sentence to a person.'
	},
	{
		id: 'zacharias',
		name: 'Zacharias Smith',
		epithet: 'The Raised Objection',
		region: 'hufflepuff',
		desiredShare: 2.0,
		era: ['second-war'],
		debut: { title: 'Order of the Phoenix', year: 2003 },
		vector: v(20, 70, -60, 40, 35, -40, 45),
		blurb:
			'You ask the sceptical question that everyone else was too polite to ask, and the question is usually fair. When it came to standing at the front, you were already at the door.',
		strength: 'You will not sign up to a thing just because the room has.',
		blindspot: 'Doubt is free, and you have never once paid for the position you took.'
	},

	// ---------------------------------------------------------------- elsewhere
	{
		id: 'grindelwald',
		name: 'Gellert Grindelwald',
		epithet: 'The Better Argument',
		region: 'unsorted',
		desiredShare: 0.5,
		era: ['first-war'],
		debut: { title: 'Fantastic Beasts', year: 2001 },
		vector: v(70, 65, -55, 95, 75, 95, -40),
		blurb:
			'You say the frightening thing openly, in good order, to a room that finds it reasonable. You are not hiding the plan; you are recruiting for it, and it is working.',
		strength: 'You can make a monstrous idea sound like the responsible one.',
		blindspot: 'You have never had to hold the position against somebody who could actually answer you.'
	},
	{
		id: 'dobby',
		name: 'Dobby',
		epithet: 'The Free One',
		region: 'unsorted',
		desiredShare: 0.92,
		era: ['second-war'],
		debut: { title: 'Chamber of Secrets', year: 1998 },
		vector: v(-70, 85, 95, 85, -85, -60, 75),
		blurb:
			'You were owned and you disobeyed anyway, badly, at real cost, for someone who had been decent to you once. You wanted nothing back and you would not be talked out of it.',
		strength: 'You act on the person in front of you and never on the instruction.',
		blindspot: 'Your help arrives at full volume, whether or not it was survivable.'
	},
	{
		id: 'kreacher',
		name: 'Kreacher',
		epithet: 'The Kept Order',
		region: 'unsorted',
		desiredShare: 0.63,
		era: ['second-war'],
		debut: { title: 'Order of the Phoenix', year: 2003 },
		vector: v(70, 40, 65, -70, 80, -75, 55),
		blurb:
			'You keep the house the way it was kept, you mutter what you think of everyone in it, and you are loyal past the death of everyone you were loyal to. Treat you decently and it turns.',
		strength: 'You carry an old promise long after everyone who made it is gone.',
		blindspot: 'You serve the house rather than the people, and the house was wrong.'
	},
	{
		id: 'moody',
		name: 'Alastor Moody',
		epithet: 'The Standing Watch',
		region: 'unsorted',
		desiredShare: 1.58,
		era: ['first-war', 'second-war'],
		debut: { title: 'Goblet of Fire', year: 2000 },
		vector: v(80, 70, -50, 55, 70, -35, 60),
		blurb:
			'You do it by the book because the book was written in blood, and you say out loud what everyone is pretending not to think. You have never let a single one of them go.',
		strength: 'You are the one who checked, and the one time it mattered you were right.',
		blindspot: 'You suspect everyone, so the person you should have suspected walked straight in.'
	},
	{
		id: 'rita',
		name: 'Rita Skeeter',
		epithet: 'The Printed Version',
		region: 'unsorted',
		desiredShare: 0.75,
		era: ['ministry'],
		debut: { title: 'Goblet of Fire', year: 2000 },
		vector: v(-50, 55, -90, 70, 60, 85, -45),
		blurb:
			'You get the story, by whatever route is open, and you print it before anyone can stop you. Whether it is true is a separate department, and it is not yours.',
		strength: 'You will publish the thing everyone agreed to keep quiet.',
		blindspot: 'You have no one, because everyone you have met is material.'
	},
	{
		id: 'crouch-sr',
		name: 'Bartemius Crouch Sr',
		epithet: 'The Letter of It',
		region: 'unsorted',
		desiredShare: 1.34,
		era: ['ministry', 'first-war'],
		debut: { title: 'Goblet of Fire', year: 2000 },
		vector: v(95, 25, -75, -70, 90, 40, -70),
		eclipses: ['umbridge'],
		blurb:
			'You applied the law without exception, including to your own, and you were admired for it right up until the bill came. You have never publicly conceded a thing.',
		strength: 'The rule you enforce is the rule you enforce on yourself, first.',
		blindspot: 'You sentenced your own son to prove a point about consistency.'
	},
	{
		id: 'filch',
		name: 'Argus Filch',
		epithet: 'The Kept Ledger',
		region: 'unsorted',
		desiredShare: 0.92,
		era: ['staff'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(75, 60, -70, -65, 85, -60, 70),
		blurb:
			'You know every rule and every offender and the exact date of each. You are the only one in the building who cannot do the thing the building is for, and everyone knows it.',
		strength: 'Nothing gets past you twice.',
		blindspot: 'You collect on children because they are the only people you outrank.'
	},
	{
		id: 'fleur',
		name: 'Fleur Delacour',
		epithet: 'The Plain Statement',
		region: 'unsorted',
		desiredShare: 0.7,
		era: ['second-war'],
		debut: { title: 'Goblet of Fire', year: 2000 },
		vector: v(-45, 85, 85, 30, -60, 55, 65),
		blurb:
			'You are told you are decorative and you correct the record immediately and at volume. When it came to the disfigured version of the man, you did not think it was a question.',
		strength: 'You state your terms and they turn out to have been the real ones.',
		blindspot: 'You take the slight personally every time, and there are a lot of them.'
	},
	{
		id: 'krum',
		name: 'Viktor Krum',
		epithet: 'The Few Words',
		region: 'unsorted',
		desiredShare: 1.5,
		era: ['second-war'],
		debut: { title: 'Goblet of Fire', year: 2000 },
		vector: v(20, -75, 70, -25, -50, 45, -60),
		blurb:
			'You are the best in the world at the thing and you would rather not discuss it. You went to the library because someone there was not looking at you, and you said so months later.',
		strength: 'You let the work make the claim and never make it yourself.',
		blindspot: 'You say so little that people write your character for you.'
	},
	{
		id: 'firenze',
		name: 'Firenze',
		epithet: 'The Long View',
		region: 'unsorted',
		desiredShare: 1.49,
		era: ['staff'],
		debut: { title: "Philosopher's Stone", year: 1997 },
		vector: v(55, -45, -40, 65, -60, -55, -60),
		blurb:
			'You broke with your own people to do one decent thing for a stranger, calmly, knowing the cost. You take the long measure of it and you are not in a hurry about any of it.',
		strength: 'You can act against your whole community without any heat at all.',
		blindspot: 'The long view is a way of not being present for the short one.'
	}
];
