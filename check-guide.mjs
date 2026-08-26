#!/usr/bin/env node
// Does this guide still tell the truth?
//
//   node check-guide.mjs
//
// WHY THIS EXISTS. The guide was frozen on 9 July 2026 and the platform kept
// shipping. By 25 August it was teaching four things that had become FALSE —
// most expensively "card checkout is demo mode, no real charge", six weeks
// after Stripe went live. Nothing failed. No screen went red. A training
// document rots silently, and the people reading it have no way to know.
//
// So the retired claims are now ASSERTED ABSENT, and the corrections ASSERTED
// PRESENT. When a rule changes again, this file changes in the same commit —
// which is the point: it makes going stale a decision instead of an accident.
//
// It is a dev tool, not part of the site. No dependencies, no build step.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "index.html"), "utf8");
const strip = (h) => h.replace(/<(script|style)[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, " ");

/** Everything the guide says. Required facts may live anywhere, including a callout. */
const text = strip(html);

/**
 * The INSTRUCTIONAL text only — what the guide teaches as current practice.
 *
 * Two things are cut out, and the reason is the whole difficulty of checking a
 * document like this: correcting a lie means QUOTING it. The changelog says, in
 * so many words, 'this guide used to tell you "card checkout is demo mode"' —
 * and a naive search cannot tell that from teaching it. Both exclusions are
 * places where retired claims legitimately appear in quotation marks:
 *
 *   #p0-changed  — the changelog, whose entire job is quoting what changed
 *   .callout     — corrections, history and "this used to say X" boxes
 *
 * A claim being TAUGHT still gets caught, because instruction lives in the body:
 * the tables, the step lists, the FAQs. Verified against the real failure — the
 * five false positives this scoping removed were all quoted corrections, and
 * re-adding any of the four retired claims to a table still fails the run.
 */
const instructional = strip(
  html
    .replace(/<section class="doc" id="p0-changed">[\s\S]*?<\/section>/g, "")
    .replace(/<div class="callout[^"]*">[\s\S]*?<\/div>/g, "")
);

let pass = 0;
const fails = [];
const ok = (label) => { pass++; };
const bad = (label, detail) => fails.push(`${label}${detail ? ` — ${detail}` : ""}`);

/** A claim the platform has retired. Finding it means the guide is teaching a lie. */
function retired(label, needle, since) {
  const re = needle instanceof RegExp ? needle : new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const hit = re.exec(instructional);
  if (hit) bad(`RETIRED CLAIM STILL PRESENT (${since}): ${label}`, `found "${hit[0].trim().slice(0, 70)}"`);
  else ok(label);
}
/** Something the guide must say, because getting it wrong costs real money. */
function must(label, needle) {
  const re = needle instanceof RegExp ? needle : new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (re.test(text)) ok(label);
  else bad(`MISSING: ${label}`);
}

console.log("\nRetired behaviour must not be taught");
// The expensive one. Five occurrences on 25 Aug, six weeks after Stripe went live.
retired("card checkout described as demo/simulated", /\b(demo mode|demo checkout|no real charge|card checkout is simulated)\b/, "Stripe live, Jul 2026");
retired("token loading amounts", /\$100 \/ \$250 \/ \$500/, "tokens grant-only, 15 Aug 2026");
retired("token loading verb", /load (afc )?tokens/i, "tokens grant-only, 15 Aug 2026");
retired("Performance level gate", /advanced classes need placement|only staff can flag an athlete as advanced/, "level stopped gating, 5 Aug 2026");
retired("six Performance classes", /six weekly classes/, "class list cut, 4 Aug 2026");
retired("the retired 8-pack", /8-pack at \$280|\$280 \(\$35/, "8-pack retired, 15 Aug 2026");
retired("afsoccer.club as our site", /families browse programs[^.]*afsoccer\.club/, "domain moved to afctraining.com");
retired("session reminders described as unbuilt", /reminder emails[^.]*designed, not yet automated/, "hourly reminder cron is live");
retired("'no admin screen grants pack sessions'", /no admin screen grants or tops up pack sessions/, "pack adjust shipped 31 Jul 2026");
retired("'the two daily automations'", /the two daily automations/, "four jobs + sweeps");

console.log("Money facts the team must not get wrong");
must("card payments stated as LIVE and real", /real cards, real money|card payments are real|is real money/i);
must("the processing fee, with its number", /2\.9%.{0,12}30/);
must("tokens stated as grant-only", /grant-only/i);
must("tokens can part-pay with the card covering the rest", /pay what they can|covering the rest|card takes the rest/i);
must("stored value never pays the $199 Pathway", /never pays the .{0,4}\$199|stored value never pays/i);
must("a parent cancel returns TOKENS by default", /returns as .{0,3}tokens|value returns as/i);
must("a card refund is admin-approved, not automatic", /admin-approved|admin approves/i);
must("one live payment request per session", /one live ask per session|one live request/i);
must("the money pages are one named account", /andre.{0,3}s account only|only person that can view money/i);

console.log("New flows are documented");
for (const [label, id] of [
  ["what changed since the freeze", "p0-changed"],
  ["what a cancellation is worth", "p1-cancel"],
  ["the waiver + signature ledger", "p1-waiver"],
  ["working a session (bubbles/add/change coach/bulk location)", "p2-session-tools"],
  ["The Money + Collections", "p2-money"],
  ["payment requests: the three doors", "p2-payment-requests"],
  ["refund requests", "p2-refund-queue"],
  ["Performance interest", "p2-performance-interest"],
]) {
  if (html.includes(`id="${id}"`)) ok(label); else bad(`MISSING SECTION: ${label} (#${id})`);
  if (html.includes(`href="#${id}"`)) ok(`${label} is in the table of contents`);
  else bad(`SECTION NOT REACHABLE: #${id} has no table-of-contents entry`);
}

console.log("The page itself is not broken");
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
// #top is the back-to-top control and has a scroll handler rather than a target.
const dangling = [...new Set([...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))].filter((h) => h !== "top" && !ids.has(h));
if (dangling.length) bad("BROKEN INTERNAL LINKS", dangling.join(", ")); else ok("every internal link resolves");
for (const tag of ["section", "div", "table", "figure"]) {
  const open = (html.match(new RegExp(`<${tag}[\\s>]`, "g")) || []).length;
  const close = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
  if (open === close) ok(`<${tag}> balanced`); else bad(`UNBALANCED <${tag}>`, `${open} open, ${close} close`);
}
const tocLinks = (html.match(/<a href="#[^"]+">/g) || []).filter((a) => !a.includes("#top")).length;
if (tocLinks > 40) ok("table of contents is populated"); else bad("table of contents looks truncated", `${tocLinks} links`);

console.log(`\n${pass} checks passed${fails.length ? `, ${fails.length} FAILED` : ""}`);
for (const f of fails) console.log(`  x ${f}`);
process.exit(fails.length ? 1 : 0);
