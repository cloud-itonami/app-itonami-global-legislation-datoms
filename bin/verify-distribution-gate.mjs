#!/usr/bin/env node
// ZB18-R1-NG02: fail-closed distribution gate.
// License: pending rights-holder decision — no LICENSE is added by this change.
// Exit 1 (quarantine) if root LICENSE is missing OR any scanned file carries
// a pending marker. Exit 0 only when LICENSE exists and no pending marker remains.
import fs from "node:fs"; import path from "node:path";
const root = path.resolve(process.argv[2] || ".");
const self = path.resolve(process.argv[1]);
const licenseNames = ["LICENSE","LICENSE.md","LICENSE.txt","COPYING","COPYING.md"];
const hasLicense = licenseNames.some(n => fs.existsSync(path.join(root,n)));
const marker = /License:\s*pending|pending rights-holder decision|権利者の決定待ち/;
const skipDirs = new Set([".git","node_modules","data","storage"]);
const exts = new Set([".cljk",".mjs",".js",".md",".edn",".txt",".yml",".yaml"]);
const quarantined = [];
function walk(dir){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ if(skipDirs.has(e.name)) continue; const p=path.join(dir,e.name); if(e.isDirectory()) walk(p); else if(exts.has(path.extname(e.name)) && path.resolve(p)!==self){ try{ const t=fs.readFileSync(p,"utf8"); if(marker.test(t)) quarantined.push(path.relative(root,p)); }catch{} } } }
walk(root);
let fail=false;
if(!hasLicense){ console.error("DISTRIBUTION BLOCKED: no LICENSE file at repository root (LICENSE decision pending)"); fail=true; }
for(const f of quarantined){ console.error(`DISTRIBUTION BLOCKED: quarantined pending-license file: ${f}`); fail=true; }
if(fail){ console.error(`FAIL -- distribution gate: license=${hasLicense?"present":"MISSING"} quarantined=${quarantined.length}`); process.exit(1); }
console.log("OK -- distribution gate: LICENSE present and no pending-license files quarantined");
