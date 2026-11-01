/**
 * Convert WildChat conversation records (HuggingFace `allenai/WildChat-1M`
 * schema) to .curt conversations.
 *
 * Schema verified against the HF datasets-server rows API
 * (`https://datasets-server.huggingface.co/rows?dataset=allenai/WildChat-1M`,
 * 2026-11-01). One JSONL line = one record:
 *
 * - Top level: `conversation_hash` (string, the record id), `model` (string),
 *   `timestamp` (ISO 8601 or null, time of last assistant turn), `conversation`
 *   (array of turns), `turn` (int, number of user turns), `language`
 *   (string, e.g. "English"), `openai_moderation` (per-turn),
 *   `detoxify_moderation` (per-turn), `toxic` (bool), `redacted` (bool),
 *   `state` / `country` / `hashed_ip` / `header` (demographic, first user turn).
 * - Turn: `role` ("user" | "assistant" | "system"), `content` (string),
 *   `language`, `country`, `state`, `hashed_ip`, `header`, `timestamp`
 *   (assistant turns carry it; user turns are null), `toxic` (bool),
 *   `redacted` (bool), `turn_identifier` (int).
 */

import { existsSync, readFileSync } from "node:fs";
import {
	type CurtConversation,
	type CurtMessage,
	parseCurt,
	serializeCurt,
} from "curt-format";

export const GENERATOR = "curt-wildchat@1.0.2";

export interface ConvertStats {
	/** Messages emitted into the conversation. */
	messages: number;
	/** Turns dropped because their `role` is not user/assistant/system. */
	skippedRoles: number;
	/** Turns with empty/missing content. */
	emptyTurns: number;
	/** Records rejected outright (no usable conversation array). */
	invalidRecords: number;
}

export interface ConvertResult {
	conversation: CurtConversation;
	stats: ConvertStats;
}

export interface ConvertOptions {
	/** Keep only records whose top-level `language` matches exactly (e.g. "English"). */
	language?: string;
	/** Derived title cap, matching the Curtis convention (60 chars). */
	titleMax?: number;
}

interface WildChatTurn {
	role?: unknown;
	content?: unknown;
	timestamp?: unknown;
	toxic?: unknown;
	redacted?: unknown;
	language?: unknown;
	country?: unknown;
	state?: unknown;
	hashed_ip?: unknown;
	header?: unknown;
	turn_identifier?: unknown;
	[key: string]: unknown;
}

interface WildChatRecord {
	conversation_hash?: unknown;
	model?: unknown;
	timestamp?: unknown;
	conversation?: unknown;
	turn?: unknown;
	language?: unknown;
	toxic?: unknown;
	redacted?: unknown;
	country?: unknown;
	state?: unknown;
	hashed_ip?: unknown;
	header?: unknown;
	openai_moderation?: unknown;
	detoxify_moderation?: unknown;
	[key: string]: unknown;
}

function isObj(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** ISO timestamp -> epoch ms; 0 when missing/unparseable (WildChat uses null for user turns). */
export function parseTimestamp(v: unknown): number {
	if (typeof v !== "string") return 0;
	const ms = Date.parse(v);
	return Number.isFinite(ms) ? ms : 0;
}

/** First user text -> display title (single line, capped). */
export function deriveTitle(text: string, max = 60): string {
	const oneLine = text.replace(/\s+/g, " ").trim();
	return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}…`;
}

/** Mirror of `record.language` -> conversation extra field. */
const LANG_KEY = "language";

function knownRole(role: unknown): "user" | "assistant" | "system" | null {
	if (role === "user" || role === "assistant" || role === "system") return role;
	return null;
}

/** Extra fields copied verbatim onto every message from its turn. */
function turnExtras(turn: WildChatTurn): Record<string, unknown> {
	const extras: Record<string, unknown> = {};
	if (typeof turn.toxic === "boolean") extras.toxic = turn.toxic;
	if (typeof turn.redacted === "boolean") extras.redacted = turn.redacted;
	if (typeof turn.language === "string") extras[LANG_KEY] = turn.language;
	if (typeof turn.country === "string") extras.country = turn.country;
	if (typeof turn.state === "string") extras.state = turn.state;
	if (typeof turn.hashed_ip === "string") extras.hashedIp = turn.hashed_ip;
	if (isObj(turn.header)) extras.header = turn.header;
	if (typeof turn.turn_identifier === "number") {
		extras.turnIdentifier = turn.turn_identifier;
	}
	return extras;
}

/**
 * Convert one WildChat record to a .curt conversation. Returns null when the
 * record has no usable `conversation` array (never half-converts).
 */
export function convertWildchat(
	record: unknown,
	options: ConvertOptions = {},
): ConvertResult | null {
	const stats: ConvertStats = {
		messages: 0,
		skippedRoles: 0,
		emptyTurns: 0,
		invalidRecords: 0,
	};

	if (!isObj(record)) return null;
	const rec = record as WildChatRecord;

	if (options.language && rec.language !== options.language) return null;

	if (!Array.isArray(rec.conversation)) return null;
	const turns = rec.conversation.filter(isObj) as WildChatTurn[];
	if (turns.length === 0) return null;

	const id =
		typeof rec.conversation_hash === "string" && rec.conversation_hash
			? rec.conversation_hash
			: null;
	if (!id) return null;

	const recordTime = parseTimestamp(rec.timestamp);
	const model = typeof rec.model === "string" && rec.model ? rec.model : undefined;

	const messages: CurtMessage[] = [];
	let n = 0;
	for (const turn of turns) {
		const role = knownRole(turn.role);
		if (!role) {
			stats.skippedRoles++;
			continue;
		}
		const content = typeof turn.content === "string" ? turn.content : "";
		if (!content) {
			stats.emptyTurns++;
			continue;
		}
		n++;
		const ts = parseTimestamp(turn.timestamp) || recordTime;
		const message: CurtMessage = {
			id: `${id}-${n}`,
			role,
			content,
			timestamp: ts,
			...turnExtras(turn),
		};
		if (role === "assistant" && model) message.model = model;
		messages.push(message);
	}
	if (messages.length === 0) return null;

	const times = messages.map((m) => m.timestamp).filter((t) => t > 0);
	const createdAt = times.length ? Math.min(...times) : 0;
	const updatedAt = times.length ? Math.max(...times) : createdAt;

	let title = "";
	for (const m of messages) {
		if (m.role === "user") {
			title = deriveTitle(m.content, options.titleMax ?? 60);
			break;
		}
	}

	const conversation: CurtConversation = {
		id,
		title,
		createdAt,
		updatedAt,
		messages,
		provider: "openai",
	};
	if (model) conversation.model = model;

	// Record-level passthrough extras.
	if (typeof rec.language === "string") {
		conversation[LANG_KEY] = rec.language;
	}
	if (typeof rec.toxic === "boolean") conversation.toxic = rec.toxic;
	if (typeof rec.redacted === "boolean") conversation.redacted = rec.redacted;
	if (typeof rec.country === "string") conversation.country = rec.country;
	if (typeof rec.state === "string") conversation.state = rec.state;
	if (typeof rec.hashed_ip === "string") conversation.hashedIp = rec.hashed_ip;
	if (isObj(rec.header)) conversation.header = rec.header;
	if (typeof rec.turn === "number") conversation.turns = rec.turn;
	if (rec.openai_moderation !== undefined) {
		conversation.openaiModeration = rec.openai_moderation;
	}
	if (rec.detoxify_moderation !== undefined) {
		conversation.detoxifyModeration = rec.detoxify_moderation;
	}

	stats.messages = messages.length;
	return { conversation, stats };
}

/** Serialize with round-trip validation. Returns null if the output fails `parseCurt`. */
export function serializeValidated(conversation: CurtConversation): string | null {
	const body = serializeCurt(conversation, GENERATOR);
	return parseCurt(body) ? body : null;
}

/**
 * Resolve a .curt output path against on-disk content. Identical content
 * overwrites in place (idempotent re-runs stay quiet); differing content is
 * a collision — curtFilename() keys on conversation identity, and real
 * corpora contain duplicate ids with diverging rows, so those get a -N
 * suffix instead of silently losing writes (last-wins was observed
 * swallowing 5 of 1000 conversions on the 1K conformance sample).
 */
export function resolveCurtWritePath(
	filePath: string,
	body: string,
): { path: string; collided: boolean } {
	if (!existsSync(filePath)) return { path: filePath, collided: false };
	if (readFileSync(filePath, "utf8") === body) return { path: filePath, collided: false };
	const stem = filePath.slice(0, -".curt".length);
	let n = 2;
	let target = `${stem}-2.curt`;
	while (existsSync(target)) target = `${stem}-${++n}.curt`;
	return { path: target, collided: true };
}
