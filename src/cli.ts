#!/usr/bin/env node
/** curt-wildchat CLI: WildChat JSONL records -> .curt files. */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { curtFilename } from "curt-format";
import {
	type ConvertOptions,
	GENERATOR,
	convertWildchat,
	serializeValidated,
} from "./wildchat.js";

interface Options extends ConvertOptions {
	outDir?: string;
	stdout: boolean;
	sample?: number;
}

function usage(): never {
	console.error(`curt-wildchat — WildChat (allenai/WildChat-1M) records -> .curt files

Usage:
  curt-wildchat <records.jsonl>
  curt-wildchat <records.jsonl> -o ./out
  curt-wildchat <records.jsonl> --sample 5

Input is JSONL: one WildChat conversation record per line (e.g. exported
from the HF datasets-server rows API or the parquet download).

Options:
  -o, --out <dir>       Output directory (default: alongside the input file)
  --sample <n>          Convert only the first n valid records
  --language <name>     Keep only records whose top-level "language" field
                        matches exactly (e.g. --language English); others
                        are skipped and counted
  --stdout              Print .curt bodies to stdout instead of writing files
  -h, --help            Show this help`);
	process.exit(2);
}

function parseArgs(argv: string[]): { input: string; options: Options } {
	const options: Options = { stdout: false };
	let input: string | undefined;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "-h" || a === "--help") usage();
		if (a === "--stdout") {
			options.stdout = true;
		} else if (a === "-o" || a === "--out") {
			const v = argv[++i];
			if (!v) usage();
			options.outDir = v;
		} else if (a === "--sample") {
			const v = argv[++i];
			const n = v ? Number(v) : NaN;
			if (!Number.isInteger(n) || n < 1) usage();
			options.sample = n;
		} else if (a === "--language") {
			const v = argv[++i];
			if (!v) usage();
			options.language = v;
		} else if (a.startsWith("-")) {
			console.error(`Unknown option: ${a}`);
			usage();
		} else if (input === undefined) {
			input = a;
		} else {
			console.error(`Unexpected extra argument: ${a}`);
			usage();
		}
	}
	if (input === undefined) usage();
	return { input, options };
}

function main(): number {
	const { input, options } = parseArgs(process.argv.slice(2));
	const raw = readFileSync(resolve(input), "utf8");
	const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

	let parsed = 0;
	let converted = 0;
	let parseErrors = 0;
	let skipped = 0;

	for (const line of lines) {
		if (options.sample && converted >= options.sample) break;
		let record: unknown;
		try {
			record = JSON.parse(line);
			parsed++;
		} catch {
			parseErrors++;
			continue;
		}
		const result = convertWildchat(record, options);
		if (!result) {
			skipped++;
			continue;
		}
		const body = serializeValidated(result.conversation);
		if (!body) {
			console.error(`round-trip validation failed for ${result.conversation.id}; not written`);
			continue;
		}
		if (options.stdout) {
			console.log(body);
		} else {
			const outDir = resolve(options.outDir ?? ".");
			mkdirSync(outDir, { recursive: true });
			const file = join(outDir, curtFilename(result.conversation));
			writeFileSync(file, body);
			console.log(file);
		}
		converted++;
	}

	console.error(
		`${GENERATOR}: ${parsed} parsed, ${converted} converted, ${parseErrors} parse errors, ${skipped} skipped`,
	);
	// Parse errors are counted, never fatal.
	return 0;
}

process.exitCode = main();
