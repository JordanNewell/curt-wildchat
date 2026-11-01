import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCurt } from "curt-format";
import {
	convertWildchat,
	deriveTitle,
	parseTimestamp,
	serializeValidated,
} from "../src/wildchat.js";

const fixturePath = join(import.meta.dirname, "fixtures", "sample.jsonl");
const lines = readFileSync(fixturePath, "utf8")
	.split(/\r?\n/)
	.filter((l) => l.trim().length > 0);
// The fixture's last line is intentionally invalid JSON (CLI parse-error case);
// it is excluded here and exercised in the CLI test.
const records = lines
	.map((l) => {
		try {
			return JSON.parse(l) as unknown;
		} catch {
			return null;
		}
	})
	.filter((r): r is Record<string, unknown> => r !== null);
// Records by fixture slot: 0 coding, 1 Spanish, 2 multi-turn, 3 redacted,
// 4 empty id, 5 empty conversation.
const [coding, spanish, multiTurn, redacted, emptyId, emptyConv] = records;

describe("parseTimestamp", () => {
	it("parses ISO 8601 to epoch ms", () => {
		expect(parseTimestamp("2023-04-09T00:02:53Z")).toBe(Date.parse("2023-04-09T00:02:53Z"));
	});
	it("returns 0 for null and garbage", () => {
		expect(parseTimestamp(null)).toBe(0);
		expect(parseTimestamp("not a date")).toBe(0);
	});
});

describe("deriveTitle", () => {
	it("collapses whitespace and caps at 60 chars", () => {
		const long = "x".repeat(100);
		expect(deriveTitle(long).length).toBe(60);
		expect(deriveTitle("  a\n\nb  ")).toBe("a b");
	});
});

describe("convertWildchat", () => {
	it("maps the coding fixture end to end", () => {
		const result = convertWildchat(coding);
		expect(result).not.toBeNull();
		const c = result!.conversation;
		expect(c.id).toBe(coding.conversation_hash);
		expect(c.provider).toBe("openai");
		expect(c.model).toBe("gpt-4-0314");
		expect(c.title).toBe(deriveTitle("What is a Fibonacci sequence and how do I compute the tenth term in Python?"));
		expect(c.messages).toHaveLength(2);
		expect(c.messages[0]!.role).toBe("user");
		expect(c.messages[1]!.role).toBe("assistant");
		expect(c.messages[1]!.model).toBe("gpt-4-0314");
	});

	it("gives assistant turns the record model but not user turns", () => {
		const c = convertWildchat(coding)!.conversation;
		expect(c.messages[0]!.model).toBeUndefined();
		expect(c.messages[1]!.model).toBeDefined();
	});

	it("uses turn timestamps, falling back to the record timestamp", () => {
		const c = convertWildchat(coding)!.conversation;
		const t = Date.parse("2023-04-09T00:02:53Z");
		expect(c.messages[0]!.timestamp).toBe(t); // user turn timestamp was null
		expect(c.createdAt).toBe(t);
		expect(c.updatedAt).toBe(t);
	});

	it("maps conversation_id (conversation_hash) and language", () => {
		const c = convertWildchat(spanish)!.conversation;
		expect(c.id).toBe(spanish.conversation_hash);
		expect(c.language).toBe("Spanish");
		expect(c.messages[0]!.language).toBe("Spanish");
	});

	it("carries moderation payloads and demographics as passthrough extras", () => {
		const c = convertWildchat(coding)!.conversation;
		expect(Array.isArray(c.openaiModeration)).toBe(true);
		expect(Array.isArray(c.detoxifyModeration)).toBe(true);
		expect(c.country).toBe("United States");
		expect(c.state).toBe("Texas");
		expect(typeof c.hashedIp).toBe("string");
		expect(c.header).toEqual(coding.header);
		expect(c.turns).toBe(1);
	});

	it("keeps per-turn toxic/redacted flags on messages", () => {
		const c = convertWildchat(redacted)!.conversation;
		expect(c.redacted).toBe(true);
		expect(c.messages[0]!.redacted).toBe(true);
		expect(c.messages[0]!.toxic).toBe(false);
	});

	it("maps system turns and skips unknown roles with a count", () => {
		const result = convertWildchat(multiTurn)!;
		const roles = result.conversation.messages.map((m) => m.role);
		expect(roles).toEqual(["user", "assistant", "system", "user", "assistant"]);
		expect(result.stats.skippedRoles).toBe(1);
	});

	it("synthesizes message ids from the record id", () => {
		const c = convertWildchat(multiTurn)!.conversation;
		expect(c.messages[0]!.id).toBe(`${multiTurn.conversation_hash}-1`);
		expect(c.messages[4]!.id).toBe(`${multiTurn.conversation_hash}-5`);
	});

	it("spans createdAt/updatedAt across the conversation", () => {
		const c = convertWildchat(multiTurn)!.conversation;
		expect(c.createdAt).toBe(Date.parse("2023-04-10T12:00:00Z"));
		expect(c.updatedAt).toBe(Date.parse("2023-04-10T12:05:00Z"));
	});

	it("derives the title from the first user turn only", () => {
		const c = convertWildchat(multiTurn)!.conversation;
		expect(c.title).toBe("First user turn.");
	});

	it("rejects records without an id", () => {
		expect(convertWildchat(emptyId)).toBeNull();
	});

	it("rejects records with an empty conversation array", () => {
		expect(convertWildchat(emptyConv)).toBeNull();
		expect(convertWildchat(null)).toBeNull();
		expect(convertWildchat("nope")).toBeNull();
	});

	it("honors the --language filter", () => {
		expect(convertWildchat(coding, { language: "English" })).not.toBeNull();
		expect(convertWildchat(spanish, { language: "English" })).toBeNull();
	});
});

describe("round-trip validation", () => {
	it("every converted fixture parses back with parseCurt", () => {
		for (const record of [coding, spanish, multiTurn, redacted]) {
			const result = convertWildchat(record);
			expect(result).not.toBeNull();
			const body = serializeValidated(result!.conversation);
			expect(body).not.toBeNull();
			const parsed = parseCurt(body!);
			expect(parsed).not.toBeNull();
			expect(parsed!.id).toBe(result!.conversation.id);
			expect(parsed!.messages).toHaveLength(result!.conversation.messages.length);
			// passthrough extras survive the round trip
			expect(parsed!.language).toBe(result!.conversation.language);
		}
	});
});
