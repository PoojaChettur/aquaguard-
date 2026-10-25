const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8'));
const { targets, survey_swath_km2 } = read('sample_targets.json');
const tele = read('sample_microplastic_telemetry.json');

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('PASS', name); };

test('11 targets present', () => assert.strictEqual(targets.length, 11));
test('unique IDs', () => assert.strictEqual(new Set(targets.map(t => t.id)).size, targets.length));
test('required fields on every target', () => {
  const req = ['id','classification','category','confidence','threat_score','shadow_length_m','length_m','width_m','height_m','depth_m','lat','lon','status'];
  targets.forEach(t => req.forEach(k => assert.ok(k in t, `${t.id} missing ${k}`)));
});
test('confidence within 0..1 and threat within 0..100', () =>
  targets.forEach(t => { assert.ok(t.confidence >= 0 && t.confidence <= 1); assert.ok(t.threat_score >= 0 && t.threat_score <= 100); }));
test('status matches threat tier', () =>
  targets.forEach(t => {
    const tier = t.threat_score >= 80 ? 'Critical' : t.threat_score >= 40 ? 'Moderate' : 'Low';
    assert.strictEqual(t.status, tier, t.id);
  }));
test('4 critical targets', () => assert.strictEqual(targets.filter(t => t.status === 'Critical').length, 4));
test('average depth is 54.8 m', () => {
  const avg = targets.reduce((s, t) => s + t.depth_m, 0) / targets.length;
  assert.strictEqual(avg.toFixed(1), '54.8');
});
test('survey swath is 19.4 km2', () => assert.strictEqual(survey_swath_km2, 19.4));
test('polymer split sums to 100', () =>
  assert.strictEqual(Object.values(tele.polymers_pct).reduce((a, b) => a + b, 0), 100));
test('telemetry target exists in registry', () => assert.ok(targets.some(t => t.id === tele.target_id)));

console.log(`\n${passed} tests passed`);
