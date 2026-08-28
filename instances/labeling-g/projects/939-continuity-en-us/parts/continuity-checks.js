// Continuity (en-US) F1–F7 checks — CONFIG-DRIVEN off FORM_SPEC (review-criteria 3778).
// FORM_SPEC is injected by scripts/build-939.mjs from config/form-spec-3778.json, so field
// visibility, required-ness, and enum option sets come from the real form config — not guesses.
// This eliminates the earlier false positives (wrong enum sets; requiring rubric fields that
// are hidden when the response is "Not Personalized"; per-field "N/A" label variants).

async function validateContinuity(conversationData) {
  const SPEC = (typeof FORM_SPEC !== 'undefined') ? FORM_SPEC : null;
  if (!SPEC) { errors.push('Continuity config (FORM_SPEC) missing — rebuild with scripts/build-939.mjs.'); return; }

  const ratingsRaw =
    conversationData?.conversation?.ratings ||
    conversationData?.task_data?.formData?.ratings ||
    conversationData?.raw_data?.formData?.ratings ||
    conversationData?.ratings;
  if (!ratingsRaw || typeof ratingsRaw !== 'object' || Array.isArray(ratingsRaw)) {
    errors.push('[ROUTE TO LEAD] Form answers not locatable on the payload (no conversation.ratings object).');
    return;
  }
  const inputRaw =
    conversationData?.conversation?.input ||
    conversationData?.task_data?.formData?.input ||
    conversationData?.raw_data?.formData?.input || {};

  const unwrap = (e) => (e && typeof e === 'object' && !Array.isArray(e) && 'value' in e) ? e.value : e;
  const csv = {}; for (const [k, v] of Object.entries(inputRaw)) csv[k] = unwrap(v);

  const isBlank = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'string' && v.trim() === '');
  const asStr = (v) => typeof v === 'string' ? v : v == null ? '' : String(v);
  const asArr = (v) => Array.isArray(v) ? v.map(asStr) : (isBlank(v) ? [] : [asStr(v)]);
  const preview = (v, n = 100) => { const s = Array.isArray(v) ? v.join(', ') : asStr(v); return s.length > n ? s.slice(0, n) + '…' : s; };
  const canon = (s) => asStr(s).normalize('NFC').toLowerCase().replace(/[→⇒]/g, '->').replace(/[^a-z0-9]+/g, '');
  const arrowCanon = (s) => asStr(s).normalize('NFC').replace(/[→⇒⭢]/g, '->').replace(/\s*->\s*/g, ' -> ').replace(/\s+/g, ' ').trim().toLowerCase();

  const err = (side, key, problem, fix, why) => { let m = `${side} — "${key}" | Problem: ${problem} | Fix: ${fix}`; if (why) m += ` | Why: ${why}`; errors.push(m); };
  const warn = (side, key, problem, fix) => warnings.push(`${side} — "${key}" | Problem: ${problem} | Fix: ${fix}`);

  const T = (k) => unwrap(ratingsRaw[k]);
  const perSide = new Set(SPEC.perSide || []);
  const ISSUE = new Set(SPEC.issueOpts || ['Minor issues', 'Major issues']);

  // --- namespace binding (F1-E2/E3) ---
  const PREFIX = 'compareModels.';
  const namespaces = [];
  for (const key of Object.keys(ratingsRaw)) {
    if (!key.startsWith(PREFIX)) continue;
    const rem = key.slice(PREFIX.length);
    if (rem === '__config__') continue;
    const idx = rem.lastIndexOf('.'); if (idx < 0) continue;
    const ns = rem.slice(0, idx); if (ns && !namespaces.includes(ns)) namespaces.push(ns);
  }
  const bindNs = (want) => want ? namespaces.find((ns) => arrowCanon(ns) === arrowCanon(want)) : null;
  let nsA = bindNs(asStr(csv['Model A']).trim());
  let nsB = bindNs(asStr(csv['Model B']).trim());
  if (!nsA && !nsB) {
    errors.push(`[ABORT] Neither model side could be bound. csv Model A="${csv['Model A'] || '(missing)'}", Model B="${csv['Model B'] || '(missing)'}". Namespaces: ${namespaces.map(n => `"${n}"`).join(', ') || '(none)'}.`);
    return;
  }
  if (!nsA || !nsB) {
    const leftover = namespaces.find((n) => n !== nsA && n !== nsB);
    errors.push(`[BINDING] ${!nsA ? 'Model A' : 'Model B'} unbindable; using "${leftover || '(none)'}". Namespaces: ${namespaces.map(n => `"${n}"`).join(', ')}.`);
    if (!nsA) nsA = leftover; else nsB = leftover;
  }
  const sides = [{ label: 'Model A', ns: nsA }, { label: 'Model B', ns: nsB }];
  const S = (ns, k) => unwrap(ratingsRaw[`${PREFIX}${ns}.${k}`]);
  const hasKey = (ns, k) => Object.prototype.hasOwnProperty.call(ratingsRaw, `${PREFIX}${ns}.${k}`);
  logs.push(`Bound Model A="${nsA}", Model B="${nsB}".`);

  // --- enum check with canonical-variant diagnosis (F6-E1) ---
  const checkEnum = (side, key, value, options) => {
    if (!options || !options.length) return;
    for (const v of asArr(value)) {
      if (options.includes(v)) continue;
      const near = options.find((o) => canon(o) === canon(v));
      if (near) err(side, key, `value "${v}" isn't an exact option (variant of "${near}").`, `select "${near}".`, 'enum canonical-variant');
      else err(side, key, `value "${v}" is not a configured option.`, `select one of: ${options.join(' / ')}.`, 'enum value not in option set');
    }
  };

  // --- Drive link protocol (F3) ---
  const URL_RE = /https?:\/\/[^\s'"<>]+/gi;
  const driveFileId = (u) => { let m = asStr(u).match(/\/file\/d\/([^/?#\s]+)/i); if (m) return m[1]; m = asStr(u).match(/[?&]id=([^&#\s]+)/i); return m ? m[1] : null; };
  const isDriveFolder = (u) => /https?:\/\/drive\.google\.com\/drive\/folders\//i.test(asStr(u));
  const isDriveHost = (u) => /^https?:\/\/drive\.google\.com\//i.test(asStr(u).trim());
  const debugFolder = asStr(csv['Google Drive Link (Debug Info)']).trim();
  const htmlFolder = asStr(csv['Google Drive Link (HTML)']).trim();
  const idRegistry = [];
  const checkArtifact = (side, key, value, kind) => {
    const s = asStr(value).trim(); if (isBlank(s)) return;
    const urls = s.match(URL_RE) || [];
    if (urls.length === 0) { err(side, key, 'holds neither a Drive link nor recognizable content.', 'paste the Google Drive file link.', `saw: "${preview(s)}"`); return; }
    if (urls.length > 1) err(side, key, `contains ${urls.length} links; must be exactly one.`, 'keep only the correct Drive file link.', `links: ${urls.slice(0, 3).join(' , ')}`);
    const url = urls[0];
    if (urls.length === 1 && s.replace(url, '').trim().length > 0) err(side, key, 'contains a link plus extra text.', 'the field must contain only the Drive file link.', `extra: "${preview(s.replace(url, '').trim())}"`);
    if (isDriveFolder(url)) {
      const batch = (kind === 'debug' && debugFolder && arrowCanon(url) === arrowCanon(debugFolder)) || (kind === 'html' && htmlFolder && arrowCanon(url) === arrowCanon(htmlFolder));
      err(side, key, `a Drive folder was linked instead of the file${batch ? ' (batch destination folder pasted unchanged)' : ''}.`, 'link the specific file, not the folder.', `folder: ${url}`); return;
    }
    const id = driveFileId(url);
    if (!id) { if (isDriveHost(url)) err(side, key, 'Drive URL is not a file link (no file id).', 'use https://drive.google.com/file/d/<id>/view.', `saw: ${url}`); else warn(side, key, `link is not on Google Drive.`, 'prefer the shared Drive so access can be verified.'); return; }
    for (const p of idRegistry) if (p.id === id) {
      if (p.kind !== kind) err(side, key, `links the same Drive file as ${p.side} "${p.key}" (${p.kind}).`, 'debug links the debug export, HTML the page — never the same file.', `shared id ${id}`);
      else if (p.side !== side) err(side, key, `both sides link the same Drive file for ${kind}.`, 'export a separate file per side.', `shared id ${id}`);
      else err(side, key, `two turns on this side link the same Drive file.`, 'export each turn to its own file.', `shared id ${id}`);
    }
    idRegistry.push({ id, side, key, kind });
  };

  // ---------------- Task-level fields ----------------
  for (const [key, def] of Object.entries(SPEC.fields)) {
    if (perSide.has(key)) continue; // handled per-side below
    const v = T(key);
    if (def.type === 'CHECKBOX') { if (v !== true) err('Task', key, 'is not completed (must be checked/true).', `complete "${key}" before submitting.`); continue; }
    if (def.required && isBlank(v)) { err('Task', key, 'is empty.', `fill in "${key}".`); continue; }
    if (!isBlank(v)) checkEnum('Task', key, v, def.options);
  }

  // F7 — firstModel vs assigned First Model is covered by the embedded 903 pipeline
  // (reported there as an error); not duplicated here to avoid a double finding.

  const raterInstr = asStr(csv['Additional Rater Instruction']);
  const wantMulti = /multi[\s_-]*turn/i.test(raterInstr), wantSingle = /single[\s_-]*turn/i.test(raterInstr);
  const citedTurns = (s) => { const out = []; let m; const re = /\[\s*turn\s*(\d+)\s*\]/gi; while ((m = re.exec(asStr(s))) !== null) out.push(parseInt(m[1], 10)); return out; };

  // ---------------- Per-side ----------------
  for (const { label: side, ns } of sides) {
    const sideName = `${side} ("${ns}")`;
    const startErr = errors.length;
    const declaredStr = asStr(S(ns, 'numberOfTurns'));
    const declared = /^[1-5]$/.test(declaredStr) ? parseInt(declaredStr, 10) : null;
    const resolve = (k) => perSide.has(k) ? S(ns, k) : T(k);

    // visibility per the config
    const visible = (key, def) => {
      if (def.artifact === 'debug') return declared == null ? true : def.turn <= declared;
      if (def.childOf) return ISSUE.has(asStr(resolve(def.childOf)));
      if (def.condRef === 'triggering') {
        const trig = asArr(resolve('model1PersonalizationTriggering'));
        return trig.some((x) => /^personalized/i.test(x));
      }
      return true;
    };

    for (const key of SPEC.perSide) {
      const def = SPEC.fields[key]; if (!def) continue;
      const vis = visible(key, def);
      const val = S(ns, key);

      if (!vis) { // filled-while-hidden (F2-E6) — but a hidden debug slot beyond declared count = stale
        if (!isBlank(val)) {
          if (def.artifact === 'debug') err(sideName, key, `Turn ${def.turn} debug is filled but the task declares only ${declared} turn(s) (stale/hidden slot).`, `clear it, or set the turn count to include Turn ${def.turn}.`);
          else err(sideName, key, `filled while hidden (its show-condition isn't met).`, 'clear it, or correct the field that controls its visibility.');
        }
        continue;
      }

      if (def.type === 'CHECKBOX') { if (val !== true) err(sideName, key, 'is not checked (must be true).', `check "${key}".`); continue; }

      if (def.artifact) {
        if (def.required && isBlank(val)) { err(sideName, key, `${def.artifact === 'html' ? 'HTML link' : `Turn ${def.turn} debug`} is empty.`, 'paste the Drive file link.'); continue; }
        checkArtifact(sideName, key, val, def.artifact);
        continue;
      }

      if (def.required && isBlank(val)) { err(sideName, key, 'is empty.', `fill in "${key}".`); continue; }
      if (isBlank(val)) continue;

      checkEnum(sideName, key, val, def.options);

      if (key === 'numberOfTurns' && declared == null) err(sideName, key, `turn count "${declaredStr}" is missing or outside 1–5.`, 'select a turn count 1–5.');

      // turns-field coherence (F6): cited turns beyond declared; N/A mixing
      if (def.turnsField) {
        const arr = asArr(val);
        if (declared != null) { const over = arr.filter((x) => /^\d+$/.test(x) && +x > declared); if (over.length) err(sideName, key, `cites turn(s) ${over.join(', ')} beyond the declared count (${declared}).`, `cite only turns 1–${declared}.`); }
        if (arr.some((x) => /^n\/?a$/i.test(x)) && arr.some((x) => /^\d+$/.test(x))) warn(sideName, key, 'mixes "N/A" with turn numbers.', 'use either N/A or turn numbers, not both.');
      }
    }

    // F6-E2 — Q1 contradiction
    const trig = asArr(S(ns, 'model1PersonalizationTriggering'));
    if (trig.some((x) => /not\s+personalized/i.test(x)) && trig.some((x) => /^personalized/i.test(x)))
      err(sideName, 'model1PersonalizationTriggering', 'marks "Not Personalized" together with a Personalized option — contradictory.', 'choose either Not Personalized or the Personalized option(s), not both.', `selected: ${trig.join(', ')}`);

    // F6 — rationale coherence
    const anyIssue = SPEC.perSide.some((k) => SPEC.fields[k]?.condRef === 'triggering' && ISSUE.has(asStr(S(ns, k))));
    const rat = S(ns, 'testModelOverallQualityRationale'); const rTurns = citedTurns(rat);
    if (anyIssue && !isBlank(rat) && rTurns.length === 0) warn(sideName, 'testModelOverallQualityRationale', 'issues are flagged but the rationale cites no [Turn N].', 'cite the turn(s) behind the flagged issue(s).');
    if (declared != null) { const over = rTurns.filter((n) => n > declared); if (over.length) warn(sideName, 'testModelOverallQualityRationale', `rationale cites [Turn ${over.join('], [Turn ')}] beyond the declared count (${declared}).`, `cite only turns 1–${declared}.`); }

    // F4 — content anchoring only if a debug slot holds pasted text (self-skips under links)
    logs.push(`${sideName}: debug slots are Drive links — F4 content anchoring runs in the tool (903 pipeline); F5 identity dormant (no verified Model-ID table).`);

    // MT/ST shape
    if ((wantMulti || wantSingle) && declared != null) {
      if (wantMulti && declared < 2) warn(sideName, 'numberOfTurns', `rater instruction "${raterInstr}" (multi-turn) but only ${declared} turn(s).`, 'if the goal was met in one turn you may proceed; otherwise add the remaining turn(s).');
      if (wantSingle && declared > 1) err(sideName, 'numberOfTurns', `rater instruction "${raterInstr}" (single-turn) but ${declared} turns.`, 'reduce to one turn or confirm the intended shape.');
    }

    if (errors.length === startErr) successes.push(`${sideName}: continuity checks passed (${declared ?? '?'} turn(s)).`);
  }

  logs.push('Continuity (en-US) config-driven validation complete (spec 3778).');
}
