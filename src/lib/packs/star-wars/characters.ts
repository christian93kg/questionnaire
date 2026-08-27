import type { Character } from '$lib/engine/types';

/**
 * Vector order is [order, candor, warmth, defiance, hope, ambition, volatility].
 *
 * Authoring rules, in priority order:
 *  1. Every character needs >=2 axes at <= -35. Negative space is the strongest
 *     predictor of a character who can actually win; being spiky in many
 *     directions is negatively correlated with winning.
 *  2. Populate the off-diagonal cells deliberately — warm-and-hard-eyed,
 *     detached-and-hopeful, ordered-and-combustible, candid-and-cold. Vectoring
 *     heroes as warm+hopeful and villains as cold+grim builds a morality proxy
 *     and collapses the space to three effective dimensions.
 *  3. No pair above 0.90 cosine. A twin is a wasted roster slot.
 *
 * desiredShare: 2.2 common/beloved, 1.4 main, 0.55 rare. Calibration solves
 * gravity to hit these; it does not read them at scoring time.
 */

const v = (
	order: number,
	candor: number,
	warmth: number,
	defiance: number,
	hope: number,
	ambition: number,
	volatility: number
) => ({ order, candor, warmth, defiance, hope, ambition, volatility });

export const CHARACTERS: Character[] = [
	// ---------------------------------------------------------------- Architects
	{
		id: 'padme',
		name: 'Padmé Amidala',
		epithet: 'The Builder',
		region: 'architects',
		desiredShare: 2.32,
		era: ['prequel'],
		vector: v(85, -40, 40, 40, 75, 55, -60),
		blurb:
			"You think in systems and long horizons. You'd rather fix the rule that keeps producing the problem than win one dramatic argument about it, and you're willing to be boring to get there.",
		strength: 'You can hold a room without raising your voice.',
		blindspot: 'You keep faith in the process past the point where the process deserves it.'
	},
	{
		id: 'mon-mothma',
		name: 'Mon Mothma',
		epithet: 'The Public Face',
		region: 'architects',
		desiredShare: 1.81,
		era: ['andor', 'ot'],
		vector: v(95, -75, -15, 25, 30, 65, -85),
		blurb:
			'You maintain a version of yourself that can be seen, and you do the real work behind it. The cost is that almost nobody in your life knows what you actually are, including the people at your table.',
		strength: 'You can smile through a dinner party that is also an operation.',
		blindspot: "You've spent the part of yourself that could still be shocked."
	},
	{
		id: 'thrawn',
		name: 'Grand Admiral Thrawn',
		epithet: 'The Student',
		region: 'architects',
		desiredShare: 0.73,
		era: ['rebels'],
		vector: v(95, -25, -85, -50, -25, -30, -95),
		blurb:
			'You learn a thing by learning what made it, and you have never once been rushed into a decision. Whatever is in front of you, you would rather understand it than beat it — though you will do both.',
		strength: 'You see the pattern three moves before it finishes drawing itself.',
		blindspot: "You've mistaken understanding people for accounting for them."
	},
	{
		id: 'tarkin',
		name: 'Grand Moff Tarkin',
		epithet: 'The Instrument',
		region: 'architects',
		desiredShare: 0.68,
		era: ['ot'],
		vector: v(90, 60, -80, -60, -40, 70, -60),
		blurb:
			'You say the unsayable thing in a level voice and watch the room adjust to it. Fear is a management tool to you, and you find it more honest than the alternatives.',
		strength: 'You never pretend the decision is harder than it is.',
		blindspot: 'You have confused being obeyed with being right.'
	},
	{
		id: 'dooku',
		name: 'Count Dooku',
		epithet: 'The Disappointed',
		region: 'architects',
		desiredShare: 3.42,
		era: ['prequel', 'clone-wars'],
		vector: v(80, 20, -55, 75, -35, 60, -50),
		blurb:
			'You were right about what was broken. That is the tragedy — you diagnosed it correctly, walked out with your principles held high, and let the walking-out become the whole of your character.',
		strength: 'You saw the rot years before the people still defending it.',
		blindspot: 'Being right about the old thing did not make you right about the new one.'
	},
	{
		id: 'palpatine',
		name: 'Emperor Palpatine',
		epithet: 'The Long Game',
		region: 'architects',
		desiredShare: 2.91,
		era: ['prequel', 'ot'],
		vector: v(85, -75, -75, -45, -60, 95, -70),
		blurb:
			'You are three moves ahead and pleasant about it. You understand that most power is handed over voluntarily by people who think they are being reasonable, and you find that genuinely interesting.',
		strength: 'You read the room better than the room reads itself.',
		blindspot: "You've started treating people as terrain. That's the whole problem."
	},

	// --------------------------------------------------------- Institutionalists
	{
		id: 'obiwan',
		name: 'Obi-Wan Kenobi',
		epithet: 'The Steady Hand',
		region: 'institutionalists',
		desiredShare: 2.15,
		era: ['prequel', 'clone-wars', 'ot'],
		vector: v(70, 40, 45, -35, 55, -50, -80),
		blurb:
			"You're the calm voice when things are on fire, and you carry responsibility for people long after they've stopped listening to you. You believe restraint is a skill, not a lack of nerve.",
		strength: 'You can hold a position without needing to win the argument.',
		blindspot: 'You confuse patience with permission, and wait too long to act.'
	},
	{
		id: 'rex',
		name: 'Captain Rex',
		epithet: 'The Good Soldier',
		region: 'institutionalists',
		desiredShare: 1.3,
		era: ['clone-wars', 'rebels'],
		vector: v(85, 50, 70, -45, 25, -55, -20),
		blurb:
			'You do it properly, you do it for the people beside you, and you do not need the reason explained twice. When you finally break with something, it is because it broke with you first.',
		strength: 'Discipline, in your hands, is a form of care.',
		blindspot: "You'll follow a bad order a long way before you let yourself name it."
	},
	{
		id: 'mace-windu',
		name: 'Mace Windu',
		epithet: 'The Verdict',
		region: 'institutionalists',
		desiredShare: 0.53,
		era: ['prequel', 'clone-wars'],
		vector: v(75, 85, -40, 45, 10, -40, -25),
		blurb:
			'You make the call, you say it plainly, and you do not soften it for comfort. People mistake that for coldness. It is closer to a refusal to waste anyone’s time with a kinder version of the truth.',
		strength: 'You will say the thing everyone is waiting for someone to say.',
		blindspot: 'Certainty arrives in you a little faster than the evidence does.'
	},
	{
		id: 'dedra',
		name: 'Dedra Meero',
		epithet: 'The Diligent',
		region: 'institutionalists',
		desiredShare: 1.13,
		era: ['andor'],
		vector: v(95, 15, -70, -55, 25, 80, -30),
		blurb:
			'You are better at this than the men above you and you have had to be twice as correct to be heard at all. You built a case nobody asked for, and you were right, and that is the problem.',
		strength: 'You find the thread everyone else filed as noise.',
		blindspot: 'You have never once asked what the machine you are excellent inside of is for.'
	},
	{
		id: 'syril',
		name: 'Syril Karn',
		epithet: 'The One Who Wanted To Be Useful',
		region: 'institutionalists',
		desiredShare: 0.57,
		era: ['andor'],
		vector: v(75, 45, -45, -60, 85, 55, 45),
		blurb:
			'You believe in the system with an intensity that embarrasses the people running it. You pressed your own uniform. You wanted, very badly, for doing it correctly to be enough.',
		strength: 'You will not let a thing go, and occasionally that is exactly what was needed.',
		blindspot: 'You keep looking for a hierarchy that deserves how much you want to serve it.'
	},
	{
		id: 'c3po',
		name: 'C-3PO',
		epithet: 'The Worrier',
		region: 'institutionalists',
		desiredShare: 0.56,
		era: ['prequel', 'ot'],
		vector: v(70, 90, 55, -75, 30, -70, 85),
		blurb:
			'You state the risk out loud, in full, with the actual numbers, and everybody tells you to be quiet. You go anyway. You have never once left, in all the years of saying you were about to.',
		strength: 'You are right about the danger far more often than anyone credits.',
		blindspot: 'Announcing the odds is not the same as helping, and you know that.'
	},

	// ---------------------------------------------------------------- Improvisers
	{
		id: 'han',
		name: 'Han Solo',
		epithet: 'The Reluctant',
		region: 'improvisers',
		desiredShare: 2.02,
		era: ['ot'],
		vector: v(-85, 60, 70, 70, -25, -45, 45),
		blurb:
			"You keep a running commentary about how none of this is your problem, right up until you're the one flying back into it. Your cynicism is a coat, not a personality.",
		strength: 'You improvise under pressure better than most people plan.',
		blindspot: "You'd rather be underestimated than be seen wanting something."
	},
	{
		id: 'poe',
		name: 'Poe Dameron',
		epithet: 'The Hotshot',
		region: 'improvisers',
		desiredShare: 1.36,
		era: ['st'],
		vector: v(55, 80, 50, 70, -40, -40, 80),
		blurb:
			'You are extremely good at the thing you do and you have not yet forgiven anyone for asking you to do a different thing. You would take the shot. You have taken the shot. It mostly worked.',
		strength: 'You commit completely, in the second where committing is the whole game.',
		blindspot: 'You keep learning the same lesson about the cost of being right too early.'
	},
	{
		id: 'ezra',
		name: 'Ezra Bridger',
		epithet: 'The Stray',
		region: 'improvisers',
		desiredShare: 1.32,
		era: ['rebels'],
		vector: v(-70, -40, 75, 65, 35, 55, 60),
		blurb:
			'You looked after yourself for long enough that being looked after still feels like a trick. You joke first, because the joke gets there before anyone can decide what you are.',
		strength: 'You attach hard and fast to the people who actually stayed.',
		blindspot: 'You will take a shortcut if it means being useful to them sooner.'
	},
	{
		id: 'hondo',
		name: 'Hondo Ohnaka',
		epithet: 'The Opportunity',
		region: 'improvisers',
		desiredShare: 0.51,
		era: ['clone-wars', 'rebels'],
		vector: v(-90, 50, -40, 55, 25, 65, 60),
		blurb:
			'You have no plan and you have never needed one. Every room contains an angle, every enemy is a future business partner, and you are delighted about all of it, sincerely.',
		strength: 'Nothing rattles you, because you were never committed to the previous version.',
		blindspot: 'Everyone likes you. Nobody counts on you. You arranged that.'
	},
	{
		id: 'lando',
		name: 'Lando Calrissian',
		epithet: 'The Host',
		region: 'improvisers',
		desiredShare: 1.15,
		era: ['ot'],
		vector: v(-40, -50, 60, 30, 40, 55, -30),
		blurb:
			'You are genuinely warm and you are also running the numbers the entire time, and both of those are true at once. You made a bad deal to protect a lot of people and you have not stopped paying for it.',
		strength: 'You can hold a difficult room and make it feel like a good evening.',
		blindspot: 'You will trade something you should not, and call it the responsible choice.'
	},
	{
		id: 'jarjar',
		name: 'Jar Jar Binks',
		epithet: 'The Well-Meaning Catastrophe',
		region: 'improvisers',
		desiredShare: 0.48,
		era: ['prequel'],
		vector: v(-90, 90, 80, -45, 80, -50, 85),
		blurb:
			'You are entirely without guile, you say every single thing you think, and you have never in your life had an ulterior motive. People underestimate what that costs the room, and what it gives it.',
		strength: 'Nobody has to wonder where they stand with you, ever.',
		blindspot: 'You will hand something enormous to someone who asks nicely.'
	},

	// ------------------------------------------------------------------ Operators
	{
		id: 'cassian',
		name: 'Cassian Andor',
		epithet: 'The One Who Pays',
		region: 'operators',
		desiredShare: 2.0,
		era: ['andor'],
		vector: v(45, -60, 40, 75, -70, -20, -25),
		blurb:
			"You did the arithmetic a long time ago and you've stopped flinching at the answer. You're the one who does the necessary thing quietly and doesn't ask to be thanked or forgiven for it.",
		strength: "You'll take the hit that keeps the work moving.",
		blindspot: "You've made peace with costs you should still be arguing about."
	},
	{
		id: 'luthen',
		name: 'Luthen Rael',
		epithet: "The Sunrise He Won't See",
		region: 'operators',
		desiredShare: 1.17,
		era: ['andor'],
		vector: v(80, -95, -65, 85, -90, 20, -35),
		blurb:
			'You decided what this would cost and then you paid it in advance, all of it, including the parts of yourself you would have liked to keep. You are not building something you expect to live in.',
		strength: 'You can hold a plan that outlasts you and never once ask for the credit.',
		blindspot: 'You have spent so much that you can no longer tell what was necessary.'
	},
	{
		id: 'fennec',
		name: 'Fennec Shand',
		epithet: 'The Professional',
		region: 'operators',
		desiredShare: 0.61,
		era: ['mando'],
		vector: v(60, 45, -60, 20, -55, 50, -80),
		blurb:
			'You are the best in the room and you do not need the room to know it. You take the job, you finish the job, and your loyalty — when you give it — is a decision, not a feeling.',
		strength: 'You do not miss, and you do not explain.',
		blindspot: 'You have made yourself so useful that nobody has ever asked what you want.'
	},
	{
		id: 'aphra',
		name: 'Doctor Aphra',
		epithet: 'The Enthusiast',
		region: 'operators',
		desiredShare: 0.56,
		era: ['ot'],
		vector: v(-55, -40, -45, 70, 40, 60, 70),
		blurb:
			'You are having a wonderful time and someone is usually about to get hurt. Curiosity beats caution in you every single time, and you have stopped pretending you find that regrettable.',
		strength: 'You will go and look at the thing everyone sensible walked away from.',
		blindspot: 'You leave, right at the moment the person beside you needs you to not.'
	},
	{
		id: 'boba-fett',
		name: 'Boba Fett',
		epithet: 'The Contract',
		region: 'operators',
		desiredShare: 0.41,
		era: ['ot', 'mando'],
		vector: v(-35, -50, 25, 40, -45, -20, -50),
		blurb:
			'You say almost nothing and it is never uncertainty. You have a code, it is short, and the last people who assumed it was the same as everyone else’s got that badly wrong.',
		strength: 'You are exactly as good as your reputation, which you did not build by talking.',
		blindspot: 'You have been owed something your whole life and you are still collecting it.'
	},
	{
		id: 'k2so',
		name: 'K-2SO',
		epithet: 'The Odds',
		region: 'operators',
		desiredShare: 0.36,
		era: ['andor'],
		vector: v(65, 95, -50, -25, -55, -60, -15),
		blurb:
			'You tell people the actual probability, unprompted, in front of everyone. You are not being cruel — the number is the number, and you have noticed that pretending otherwise gets people killed.',
		strength: 'You are the only one in the room who will say it.',
		blindspot: 'You are far more attached to these people than your delivery suggests.'
	},

	// -------------------------------------------------------------------- Anchors
	{
		id: 'chewbacca',
		name: 'Chewbacca',
		epithet: 'The Anchor',
		region: 'anchors',
		desiredShare: 1.33,
		era: ['ot'],
		vector: v(-30, -45, 90, -30, 50, -80, -40),
		blurb:
			"You're the one who shows up early, carries the heavy thing, and stays until it's finished. People feel steadier when you're there and mostly can't explain why.",
		strength: 'Your presence is the whole contribution, and it is a real one.',
		blindspot: "You'll follow someone loyally for years without ever asking where you're going."
	},
	{
		id: 'din',
		name: 'Din Djarin',
		epithet: 'The Code',
		region: 'anchors',
		desiredShare: 2.11,
		era: ['mando'],
		vector: v(45, -40, 60, -30, 15, -85, -65),
		blurb:
			"You have a small number of rules and you don't renegotiate them at parties. You'd rather be quietly reliable to four people than broadly liked by four hundred.",
		strength: "Whatever you said you'd do is already done.",
		blindspot: "You take on people you can't put down, and you never mention the weight."
	},
	{
		id: 'hera',
		name: 'Hera Syndulla',
		epithet: 'The Captain',
		region: 'anchors',
		desiredShare: 1.46,
		era: ['rebels'],
		vector: v(70, 40, 70, 45, 55, -45, -60),
		blurb:
			'You made a home out of a ship and a family out of strays, and you run both like an operation because that is what keeps them alive. Nobody has ever seen you panic. That is not the same as you not panicking.',
		strength: 'You hold a crew together through things that should have broken it.',
		blindspot: 'You take the whole weight and call it captaincy.'
	},
	{
		id: 'chirrut',
		name: 'Chirrut Îmwe',
		epithet: 'The Faith',
		region: 'anchors',
		desiredShare: 0.47,
		era: ['andor'],
		vector: v(-20, 55, -40, 25, 95, -80, -55),
		blurb:
			'You are certain about something you cannot prove and you have organised your whole life around it, calmly, without needing anyone else to agree. It has not once made you unkind.',
		strength: 'You walk into the open while everyone else is still calculating.',
		blindspot: 'Your certainty is a gift to you and occasionally a bill for the people beside you.'
	},
	{
		id: 'grogu',
		name: 'Grogu',
		epithet: 'The Small Weight',
		region: 'anchors',
		desiredShare: 1.32,
		era: ['mando'],
		vector: v(-45, -55, 85, -20, 60, -70, 45),
		blurb:
			'You have been through more than anyone has thought to ask you about, and you are still reaching for people. You want very little, and you want it completely.',
		strength: 'You make the people around you better at being people.',
		blindspot: 'You have learned to be easy to keep, which is not the same as being safe.'
	},
	{
		id: 'bodhi',
		name: 'Bodhi Rook',
		epithet: 'The Defector',
		region: 'anchors',
		desiredShare: 0.31,
		era: ['andor'],
		vector: v(60, -40, 45, 40, -40, -75, 90),
		blurb:
			'You were frightened the entire time and you did it anyway, which is the only version of this that ever counts. You did not want to be brave. You wanted the thing to get where it was going.',
		strength: 'You crossed the line when crossing it was the whole risk.',
		blindspot: 'You still think of yourself as the one who was on the wrong side.'
	},

	// -------------------------------------------------------------------- Walkers
	{
		id: 'ahsoka',
		name: 'Ahsoka Tano',
		epithet: 'The One Who Walked',
		region: 'walkers',
		desiredShare: 2.18,
		era: ['clone-wars', 'rebels', 'mando'],
		vector: v(10, 20, 25, 90, 35, -45, -50),
		blurb:
			"You gave something your whole self, found out it wouldn't do the same for you, and left with your principles intact. You still do the work. You just don't do it for them anymore.",
		strength: 'Your loyalty is to the thing, not the institution wearing its name.',
		blindspot: 'Leaving is a real skill and you reach for it early.'
	},
	{
		id: 'kanan',
		name: 'Kanan Jarrus',
		epithet: 'The Reluctant Teacher',
		region: 'walkers',
		desiredShare: 1.33,
		era: ['rebels'],
		vector: v(15, -35, 55, 60, 30, -60, -20),
		blurb:
			'You spent years being nobody in particular because being somebody had got everyone around you killed. Then someone needed teaching, and you found out you had not actually put it down.',
		strength: 'You are far better at this than the version of you that hid would admit.',
		blindspot: 'You still half-expect to be found out as the one who ran.'
	},
	{
		id: 'rey',
		name: 'Rey',
		epithet: 'The Scavenger',
		region: 'walkers',
		desiredShare: 2.07,
		era: ['st'],
		vector: v(40, -45, 60, 45, 75, -40, 55),
		blurb:
			"You built yourself out of whatever was lying around, and you're better at it than people who were handed a set of instructions. You want to belong somewhere and you're wary of admitting it.",
		strength: 'You learn absurdly fast when it actually matters.',
		blindspot: "You're still half-waiting for someone to come back for you."
	},
	{
		id: 'bo-katan',
		name: 'Bo-Katan Kryze',
		epithet: 'The Claim',
		region: 'walkers',
		desiredShare: 1.78,
		era: ['clone-wars', 'mando'],
		vector: v(75, 60, -35, 70, -40, 80, 30),
		blurb:
			'You believe the thing is yours by right and you have been proven wrong about that more than once, publicly. You keep going back. Whatever this is, it is not vanity — it costs you too much.',
		strength: 'You will rebuild something everyone else has agreed is finished.',
		blindspot: 'You want it handed to you and earned, and those cannot both happen.'
	},

	// ------------------------------------------------------------------ Believers
	{
		id: 'luke',
		name: 'Luke Skywalker',
		epithet: 'The True Believer',
		region: 'believers',
		desiredShare: 2.18,
		era: ['ot'],
		vector: v(-45, 75, 85, 30, 95, -55, -30),
		blurb:
			"You lead with hope, and you know it's a choice rather than a mood. You'll extend trust to people who haven't earned it yet because you'd rather be occasionally wrong than permanently guarded.",
		strength: "You see who someone could be, and sometimes that's enough to make it happen.",
		blindspot: "You'll walk straight into an obvious trap if there's someone worth saving inside it."
	},
	{
		id: 'finn',
		name: 'Finn',
		epithet: 'The One Who Ran First',
		region: 'believers',
		desiredShare: 1.33,
		era: ['st'],
		vector: v(-40, 85, 85, 20, -40, -60, 85),
		blurb:
			'You got out, and the getting out was the bravest thing in the room even though it looked like the opposite. You keep telling people the truth about yourself before they can find it out.',
		strength: 'You will say "I was wrong, and here is what I actually am" out loud.',
		blindspot: 'Your first instinct is still the door, and you hate that about yourself.'
	},
	{
		id: 'qui-gon',
		name: 'Qui-Gon Jinn',
		epithet: 'The One Who Said No',
		region: 'believers',
		desiredShare: 0.33,
		era: ['prequel'],
		vector: v(40, 45, 30, 70, 80, -70, -70),
		blurb:
			'You follow what is in front of you rather than what you were instructed to follow, and you have made peace with the career that cost you. You were never going to be on the council. You knew.',
		strength: 'You notice the person everyone else has classified as irrelevant.',
		blindspot: 'You trust your own read so completely that you stop making the case for it.'
	},

	// -------------------------------------------------------------------- Burners
	{
		id: 'maul',
		name: 'Maul',
		epithet: 'The Grudge',
		region: 'burners',
		desiredShare: 0.87,
		era: ['prequel', 'clone-wars', 'rebels'],
		vector: v(-40, -50, -60, 80, -75, 75, 90),
		blurb:
			'You were made into a tool, you survived it, and you have organised every year since around the debt. You are still here entirely on spite, and spite has turned out to be enormously durable.',
		strength: 'Nothing has ever finished you. Several things have tried.',
		blindspot: 'You outlived your revenge and never built anything to put in its place.'
	},
	{
		id: 'kylo',
		name: 'Kylo Ren',
		epithet: 'The Unfinished',
		region: 'burners',
		desiredShare: 0.67,
		era: ['st'],
		vector: v(-50, 55, 45, 85, -35, 85, 95),
		blurb:
			'You are enormously powerful and about nineteen years old somewhere important. Everything you destroy, you destroy because it reminded you that you have not decided what you are yet.',
		strength: 'You will burn the thing down rather than live inside a lie about it.',
		blindspot: 'You keep mistaking the tantrum for the decision.'
	},
	{
		id: 'saw',
		name: 'Saw Gerrera',
		epithet: 'The One Who Went Too Far',
		region: 'burners',
		desiredShare: 0.59,
		era: ['andor'],
		vector: v(-25, 70, -40, 95, -60, 25, 90),
		blurb:
			'You were the first one willing and you are the last one still going, and somewhere in between you stopped being able to tell allies from threats. You were right early, which is its own kind of curse.',
		strength: 'You started fighting when fighting was still unreasonable.',
		blindspot: 'You have purged everyone who might have told you when to stop.'
	},
	{
		id: 'jyn',
		name: 'Jyn Erso',
		epithet: 'The Loose End',
		region: 'burners',
		desiredShare: 1.1,
		era: ['andor'],
		vector: v(-60, -55, 35, 70, -50, -25, 30),
		blurb:
			'You have been left behind by everyone who was supposed to keep you, so you learned to need nothing and to be extremely hard to hold onto. Then a cause got underneath your guard anyway.',
		strength: 'You commit late, completely, and past the point where it was survivable.',
		blindspot: 'You will not ask for help, and you will resent not getting it.'
	},
	{
		id: 'ventress',
		name: 'Asajj Ventress',
		epithet: 'The Discarded',
		region: 'burners',
		desiredShare: 2.23,
		era: ['clone-wars'],
		vector: v(40, -55, 20, 50, -40, 25, -30),
		blurb:
			'You were used and then thrown away by two separate people who claimed you, and you have built a self out of never letting that be the story. You work alone now, and it suits you more than you admit.',
		strength: 'You are the only person who has never once abandoned you.',
		blindspot: 'You test people until they leave, then count it as evidence.'
	},
	{
		id: 'vader',
		name: 'Darth Vader',
		epithet: 'The Weight',
		region: 'burners',
		desiredShare: 2.02,
		era: ['ot'],
		vector: v(55, 50, 25, -60, -45, 45, 60),
		blurb:
			"Something happened that you couldn't stop, and you reorganised your entire life around never being that powerless again. You are extremely effective and not especially free.",
		strength: 'Once you decide, nothing bends you.',
		blindspot: "You call it protecting people. Ask them if that's what it feels like."
	},

	// --------------------------------------------------------------------- Fixers
	{
		id: 'r2d2',
		name: 'R2-D2',
		epithet: 'The Fixer',
		region: 'fixers',
		desiredShare: 1.22,
		era: ['prequel', 'ot'],
		vector: v(-55, -70, 60, 55, 45, -50, -25),
		blurb:
			"The plan dies, everyone panics, and you're already elbow-deep in the problem. You have an unreasonable success rate and no interest in explaining your method.",
		strength: 'You start solving before anyone finishes describing.',
		blindspot: "You'd rather do it yourself than spend ten minutes telling someone how."
	},
	{
		id: 'chopper',
		name: 'Chopper',
		epithet: 'The Menace',
		region: 'fixers',
		desiredShare: 0.55,
		era: ['rebels'],
		vector: v(-75, 60, -30, 70, 10, -40, 80),
		blurb:
			'You are rude, you are not sorry, and you would walk into anything for these specific people without ever once being nice about it. The affection is real. It is just extremely well disguised.',
		strength: 'You do the ugly necessary job nobody wants to have asked for.',
		blindspot: 'You have made being difficult load-bearing, and it is doing work you should do directly.'
	},
	{
		id: 'krennic',
		name: 'Orson Krennic',
		epithet: 'The One Who Wanted Credit',
		region: 'fixers',
		desiredShare: 0.68,
		era: ['andor'],
		vector: v(70, -40, -60, 45, 55, 95, 70),
		blurb:
			'You built the thing. You actually did — the achievement is real, and so is the fact that you cannot stop needing someone senior to say so. You go over heads. It has never once worked.',
		strength: 'You will deliver the impossible project on an impossible schedule.',
		blindspot: 'You want the room to admit you belong in it, and asking is how you lose it.'
	},

	// -------------------------------------------------------------- Line-Holders
	{
		id: 'leia',
		name: 'Leia Organa',
		epithet: 'The One Who Holds the Line',
		region: 'line-holders',
		desiredShare: 0.25,
		era: ['ot'],
		vector: v(-45, 90, 60, 75, -40, 70, -60),
		blurb:
			'You are the person the group turns to at the exact moment things stop being fun. Decisions get made faster when you are in the room, and you carry the cost of that without advertising it.',
		strength: 'You can be furious and correct at the same time, and still give the order.',
		blindspot: 'You absorb so much that nobody thinks to ask if you are alright.'
	},
	{
		id: 'yoda',
		name: 'Yoda',
		epithet: 'The Long View',
		region: 'line-holders',
		desiredShare: 1.4,
		era: ['prequel', 'clone-wars', 'ot'],
		vector: v(25, -65, -55, -15, 60, -70, -80),
		blurb:
			"You've watched enough things play out that urgency doesn't move you the way it moves everyone else. You give advice once, clearly, and then let people go make their mistake.",
		strength: 'You can sit with a problem long enough to see what it actually is.',
		blindspot: 'Perspective can look a lot like not helping when someone needs help now.'
	}
];
