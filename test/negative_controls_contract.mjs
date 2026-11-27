#!/usr/bin/env node
// ZB18-R1-NG03/NG04/NG05 negative controls. Run: node test/negative_controls_contract.mjs
// NG03/NG05 scripts use kotoba.lang.text (alias of clojure.string); temp copies
// rewrite that one require so stock nbb can execute the identical logic.
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import crypto from "node:crypto"; import {spawnSync} from "node:child_process";
const nbb = process.env.NBB_BIN || "nbb";
const shim = (src,out) => { fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out, fs.readFileSync(src,"utf8").replaceAll("kotoba.lang.text","clojure.string").replace(/str\/upper(?![-a-z])/g,"str/upper-case")); };
const runNbb = (script,args,cwd) => { const r=spawnSync(nbb,[script,...args],{encoding:"utf8",cwd:cwd||".",timeout:180000}); return {status:r.status,out:(r.stdout||"")+(r.stderr||"")}; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(),"zb18-"));
try {
  // NG04 relations shape (real verifier, no shim needed)
  const relBad = path.join(tmp,"relations-bad.edn"), relGood = path.join(tmp,"relations-good.edn");
  fs.writeFileSync(relGood, `[#:law.rel{:id "a|amends|b" :from "a" :to "b" :kind :law.rel/amends :resolved? false}]\n`);
  fs.writeFileSync(relBad, `[#:law.rel{:id "a|amends|b" :from "a" :to "b" :resolved? false} #:law.rel{:id "c|x|d" :from "c" :kind :law.rel/amends :resolved? false}]\n`);
  const shapeScript = path.resolve("bin/verify-relations-shape.cljk");
  let r = runNbb(shapeScript,[relGood]); if(r.status!==0) throw new Error("NG04 external resolved? false edge must pass: "+r.out);
  r = runNbb(shapeScript,[relBad]); if(r.status===0) throw new Error("NG04 missing kind/to must fail");
  if(!r.out.includes(":rel/kind")) throw new Error("NG04 must name :rel/kind: "+r.out);
  if(!r.out.includes(":rel/to")) throw new Error("NG04 must name :rel/to: "+r.out);
  console.log("NG04 relations shape: external edge passes, missing kind/to rejected by name");

  // NG03 unknown jurisdiction via real build.cljk (shimmed copy)
  const bRoot = path.join(tmp,"build"); fs.mkdirSync(path.join(bRoot,"data/seed"),{recursive:true}); fs.mkdirSync(path.join(bRoot,"src/com-etzhayyim-ooyake/registry"),{recursive:true});
  for(const f of ["legal-sources.edn","prohibited-sources.edn","hanrei-coverage.edn"]) fs.copyFileSync(path.join("data/seed",f), path.join(bRoot,"data/seed",f));
  const reg = path.join(bRoot,"src/com-etzhayyim-ooyake/registry");
  fs.writeFileSync(path.join(reg,"gov-units.world-legislatures.edn"), `{:units [{:gov.unit/id "x1" :gov.unit/jurisdiction "XXX" :gov.unit/name-en "Nowhere" }]}\n`);
  fs.writeFileSync(path.join(reg,"gov-units.world-courts.edn"), `{:units []}\n`);
  fs.writeFileSync(path.join(reg,"gov-units.world-countries.edn"), `{:units []}\n`);
  fs.writeFileSync(path.join(reg,"gov-units.seed.edn"), `{:units []}\n`);
  fs.writeFileSync(path.join(reg,"gov-units.g20.edn"), `{:units []}\n`);
  const buildCopy = path.join(tmp,"build.cljk"); shim(path.resolve("bin/build.cljk"), buildCopy);
  r = runNbb(buildCopy,["src"], bRoot);
  if(r.status===0) throw new Error("NG03 unknown jurisdiction XXX must fail, got pass: "+r.out);
  if(!r.out.includes("XXX")) throw new Error("NG03 must name XXX: "+r.out);
  if(!/unknown jurisdiction/.test(r.out)) throw new Error("NG03 must say unknown jurisdiction: "+r.out);
  console.log("NG03 build: unknown jurisdiction XXX rejected by name (no supranational fallback)");

  // NG05 invalid ELI via real verify-eli-coverage.cljk (shimmed copy)
  const eRoot = path.join(tmp,"eli"); fs.mkdirSync(path.join(eRoot,"data/corpus/eu.europa.eur-lex"),{recursive:true}); fs.mkdirSync(path.join(eRoot,"coverage"),{recursive:true});
  const shard = path.join(eRoot,"data/corpus/eu.europa.eur-lex/laws-000.edn");
  const shardText = `[{:law/key "eu:1" :law/jurisdiction "EU" :law/eli "not-a-valid-eli-uri"}]\n`;
  fs.writeFileSync(shard, shardText);
  const sha = crypto.createHash("sha256").update(shardText).digest("hex");
  fs.writeFileSync(path.join(eRoot,"coverage/eli-coverage.edn"), `{:eli-coverage/shards [{:path "data/corpus/eu.europa.eur-lex/laws-000.edn" :sha256 "${sha}" :bytes ${Buffer.byteLength(shardText)} :laws 1}] :eli-coverage/rows [] :eli-coverage/totals {} :eli-coverage/shapes []}\n`);
  const eliCopy = path.join(tmp,"verify-eli.cljk"); shim(path.resolve("bin/verify-eli-coverage.cljk"), eliCopy);
  r = runNbb(eliCopy,[], eRoot);
  if(r.status===0) throw new Error("NG05 invalid ELI must fail");
  if(!r.out.includes("invalid ELI URI")) throw new Error("NG05 must name invalid ELI URI: "+r.out);
  if(!r.out.includes("eu:1")) throw new Error("NG05 must name law key: "+r.out);
  console.log("NG05 ELI: invalid URI rejected naming law key and cause");
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }
console.log({status:"ok"});
