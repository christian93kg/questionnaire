export type AxisId = string;
export type TierId = 'short' | 'medium' | 'long';

export const TIER_RANK: Record<TierId, number> = { short: 0, medium: 1, long: 2 };

export interface AxisPole {
	label: string;
	blurb: string;
}

export interface Axis {
	id: AxisId;
	label: string;
	negative: AxisPole;
	positive: AxisPole;
	/** What this axis must not drift into. Documentation for authors; unused at runtime. */
	distinctFrom?: string;
}

/** Missing key means 0. */
export type AxisVector = Partial<Record<AxisId, number>>;

export interface Character {
	id: string;
	name: string;
	epithet: string;
	vector: AxisVector;
	blurb: string;
	strength: string;
	blindspot: string;
	/** Relative share of results this character should win. Calibration solves gravity to hit it. */
	desiredShare?: number;
	/** Roster-QA tag. Never used in scoring. */
	region: string;
	/** Near-duplicates that must not appear alongside this character in a crew. */
	eclipses?: string[];
	era?: string[];
}

export interface QuestionOption {
	id: string;
	text: string;
	v: AxisVector;
	/** Hand-placed flavour: characterId -> 0..1. Capped by pack.signatureWeight. */
	sig?: Record<string, number>;
}

export interface Question {
	id: string;
	text: string;
	preamble?: string;
	options: QuestionOption[];
	/** Smallest tier that includes this question. Tiers are nested supersets. */
	tier: TierId;
	primaryAxis: AxisId;
}

export interface QuizTier {
	id: TierId;
	label: string;
	blurb: string;
	questionCount: number;
	estMinutes: number;
}

export interface PackAudit {
	winRate: Record<string, number>;
	unreachable: string[];
	maxAxisCorrelation: number;
	effectiveDimensions: number;
	twins: Array<[string, string, number]>;
}

export interface PackCalibration {
	mean: Record<AxisId, number>;
	sd: Record<AxisId, number>;
	axisWeight: Record<AxisId, number>;
	gravity: Record<string, number>;
	/** Median top1-top2 margin per tier. Normalises the margin half of confidence. */
	marginScale: Record<TierId, number>;
	simulations: number;
	generatedAt: string;
	audit: PackAudit;
}

export interface PackMigration {
	fromVersion: number;
	toVersion: number;
	tier: TierId;
	/** One entry per question in the NEW set. `take` indexes the OLD answer array. */
	remap: Array<{ take: number } | { drop: true }>;
}

export interface QuizPack {
	id: string;
	version: number;
	title: string;
	formCode: string;
	intro: { eyebrow: string; lede: string[]; fine: string };
	axes: Axis[];
	characters: Character[];
	/** Master bank in stable order. Tier membership is a property of each question. */
	questions: Question[];
	tiers: QuizTier[];
	signatureWeight: number;
	calibration: PackCalibration;
	migrations?: PackMigration[];
	theme?: Record<string, string>;
}

export interface CharacterScore {
	characterId: string;
	score: number;
	raw: number;
	cos: number;
	rank: number;
}

export interface DecisiveAnswer {
	questionId: string;
	questionIndex: number;
	optionId: string;
	delta: number;
	wouldFlip: boolean;
	counterfactualWinner?: string;
	axis: AxisId;
}

export type ConfidenceBand = 'provisional' | 'clear' | 'unambiguous';

export interface ScoreResult {
	packId: string;
	packVersion: number;
	tier: TierId;
	/** -100..100 per axis, range-normalised. What the profile chart plots. */
	vector: Record<AxisId, number>;
	/** Soft-clipped z vs. the roster. Drives "you are +1.8 sigma concealed". */
	z: Record<AxisId, number>;
	/** How much this tier actually asked about each axis. */
	coverage: Record<AxisId, number>;
	ranked: CharacterScore[];
	winner: string;
	crew: string[];
	/** Null when nobody is genuinely anti-correlated. */
	opposite: string | null;
	confidence: number;
	confidenceBand: ConfidenceBand;
	stability: number;
	decisive: DecisiveAnswer[];
	answers: number[];
	code: string;
}
