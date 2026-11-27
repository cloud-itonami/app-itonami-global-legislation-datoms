#!/usr/bin/env node
// ZB18-R1-NG02 contract. Run: node test/distribution_gate_contract.mjs
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import {spawnSync} from "node:child_process";
const gate = path.resolve("bin/verify-distribution-gate.mjs");
const run = (root) => { const r = spawnSync(process.execPath,[gate,root],{encoding:"utf8"}); return {status:r.status, out:(r.stdout||"")+(r.stderr||"")}; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(),"ng02-"));
try {
  // real repo: fail-closed
  const real = run(".");
  if (real.status===0) throw new Error("real repo must be blocked (no LICENSE + pending)");
  if (!real.out.includes("no LICENSE")) throw new Error("real repo must name LICENSE: "+real.out);
  if (!real.out.includes("verify-canonical-uri-sample")) throw new Error("must quarantine pending file: "+real.out);
  // temp positive: LICENSE + clean file
  const ok = path.join(tmp,"ok"); fs.mkdirSync(path.join(ok,"bin"),{recursive:true});
  fs.writeFileSync(path.join(ok,"LICENSE"),"MIT\n"); fs.writeFileSync(path.join(ok,"bin/clean.cljk"),";; clean\n");
  const p = run(ok); if(p.status!==0) throw new Error("LICENSE+clean must pass: "+p.out);
  // temp negative: LICENSE but pending remains
  fs.writeFileSync(path.join(ok,"bin/pending.cljk"),";; License: pending rights-holder decision\n");
  const n = run(ok); if(n.status===0) throw new Error("pending file must block even with LICENSE");
  if(!n.out.includes("pending.cljk")) throw new Error("must name quarantined file: "+n.out);
  console.log("NG02 distribution gate: real blocked, LICENSE+clean passes, pending quarantined");
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }
console.log({status:"ok"});
