// Demo stub for pe-wasm — drives every UI surface with domain-coherent data.
// The real wasm-pack build returns identically-shaped values from pe-core /
// pe-neural / pe-vector / pe-quantum-wasm / pe-ledger / pe-rvf.

// ── Yamanaka factors — canonical N-terminal fragments (plausible sequences) ──
const FACTORS = {
  OCT4: {
    name: "OCT4",
    full_name: "POU class 5 homeobox 1 (POU5F1)",
    target_residues: 360,
    target_sequence:
      "MAGHLASDFAFSPPPGGGGDGPGGPEPGWVDPRTWLSFQGPPGGPGIGPGVGPGSEVWGIPPCPPPYEFCGGMAYCG",
    role: "core pluripotency · binds POU/HOX motifs",
  },
  SOX2: {
    name: "SOX2",
    full_name: "SRY-box transcription factor 2",
    target_residues: 317,
    target_sequence:
      "MYNMMETELKPPGPQQTSGGGGGNSTAAAAGGNQKNSPDRVKRPMNAFMVWSRGQRRKMAQENPKMHNSEISKRLGAE",
    role: "synergistic with OCT4 · HMG-box DNA binding",
  },
  KLF4: {
    name: "KLF4",
    full_name: "Kruppel-like factor 4",
    target_residues: 513,
    target_sequence:
      "MAVSDALLPSFSTFASGPAGREKTLRQAGAPNNRWREELSHMKRLPPVLPGRPYDLAAATVATDLESGGAGAACGGSNL",
    role: "tumor-suppressor balance · zinc-finger TF",
  },
  CMYC: {
    name: "CMYC",
    full_name: "MYC proto-oncogene",
    target_residues: 439,
    target_sequence:
      "MPLNVSFTNRNYDLDYDSVQPYFYCDEEENFYQQQQQSELQPPAPSEDIWKKFELLPTPPLSPSRRSGLCSPSYVAVTPF",
    role: "transcriptional amplifier · bHLH-Zip",
  },
};

// ── deterministic pseudo-random from sequence text ───────────────────────────
function seedHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return h >>> 0;
}
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ── scoring ──────────────────────────────────────────────────────────────────
function factorOf(seq) {
  let best = "OCT4";
  let bestOverlap = -1;
  for (const f of Object.values(FACTORS)) {
    const overlap = lcsLength(f.target_sequence.slice(0, 24), seq.slice(0, 24));
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = f.name;
    }
  }
  return best;
}
function lcsLength(a, b) {
  let m = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) m++;
  return m;
}

export function score_sequence(sequence) {
  const rng = mulberry32(seedHash(sequence));
  const target = FACTORS[factorOf(sequence)].target_sequence;
  const overlap = lcsLength(target, sequence) / Math.max(target.length, sequence.length);
  const reprogramming_efficiency = clamp01(0.55 + overlap * 0.4 + (rng() - 0.5) * 0.08);
  const expression_stability = clamp01(0.6 + (rng() - 0.3) * 0.3);
  const structural_plausibility = clamp01(0.55 + (rng() - 0.4) * 0.4);
  const safety_score = clamp01(0.7 + (rng() - 0.5) * 0.25);
  const composite =
    0.35 * reprogramming_efficiency +
    0.25 * expression_stability +
    0.2 * structural_plausibility +
    0.2 * safety_score;
  return {
    reprogramming_efficiency,
    expression_stability,
    structural_plausibility,
    safety_score,
    composite: Number(composite.toFixed(4)),
    target_factor: factorOf(sequence),
  };
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

// ── evolution cycle ──────────────────────────────────────────────────────────
const AMINO = "ACDEFGHIKLMNPQRSTVWY";

export function run_evolution_step(population_json, config_json) {
  const config = JSON.parse(config_json || "{}");
  const pop = JSON.parse(population_json || "[]");
  const seed = pop[0] ?? { sequence: FACTORS.OCT4.target_sequence, target_factor: "OCT4" };
  const rng = mulberry32(seedHash(seed.sequence + ":" + (config.generation ?? 0)));
  const popSize = config.population_size ?? 8;
  const topK = config.top_k ?? 3;
  const variants = [];
  for (let i = 0; i < popSize; i++) {
    const seq = mutate(seed.sequence, config.mutation_rate ?? 0.05, rng);
    const score = score_sequence(seq);
    variants.push({
      name: `${seed.target_factor}-v${config.generation ?? 1}.${i + 1}`,
      sequence: seq,
      composite: score.composite,
      score,
      mutations: diffMutations(seed.sequence, seq),
    });
  }
  variants.sort((a, b) => b.composite - a.composite);
  return {
    generation: config.generation ?? 1,
    variants_created: popSize,
    variants_scored: popSize,
    variants_validated: popSize,
    variants_screened: variants.filter((v) => v.score.safety_score > 0.6).length,
    promoted: variants.slice(0, topK).map((v) => ({
      name: v.name,
      sequence: v.sequence,
      composite: v.composite,
      mutations: v.mutations,
    })),
  };
}

function mutate(seq, rate, rng) {
  const arr = [...seq];
  for (let i = 0; i < arr.length; i++) {
    if (rng() < rate) arr[i] = AMINO[Math.floor(rng() * AMINO.length)];
  }
  return arr.join("");
}

function diffMutations(parent, child) {
  const out = [];
  const n = Math.min(parent.length, child.length);
  for (let i = 0; i < n; i++) {
    if (parent[i] !== child[i]) out.push({ position: i + 1, from: parent[i], to: child[i] });
  }
  return out;
}

// ── massive directed-evolution search ────────────────────────────────────────
//
// Simulates an at-scale search across `budget` variants, returning a histogram
// of the explored fitness distribution, the top-K winners, and a "best-so-far"
// curve sampled at log-spaced checkpoints. The UI animates the reveal so it
// feels like an actual long-running search.

export function run_massive_search(seed_json, budget) {
  const seed = JSON.parse(seed_json || "{}");
  const seedSeq = seed.sequence ?? FACTORS.OCT4.target_sequence;
  const factor = seed.target_factor ?? factorOf(seedSeq);
  const rng = mulberry32(seedHash("massive:" + seedSeq + ":" + budget));

  const planned = Math.max(1000, budget);
  // Synthetic explore count — drift a bit above/below planned for realism
  const explored = Math.floor(planned * (0.97 + rng() * 0.08));

  // Histogram: 40 bins over composite [0..1], shaped like a right-skewed normal
  const BIN_COUNT = 40;
  const histogram = new Array(BIN_COUNT).fill(0);
  // Generate ~6k samples to populate the histogram, then scale up
  const SAMPLES = 6000;
  let bestComposite = 0;
  for (let i = 0; i < SAMPLES; i++) {
    // mixture of two normals: mostly mediocre, occasional excellent
    const peak = rng() < 0.92 ? 0.52 : 0.78;
    const spread = rng() < 0.92 ? 0.11 : 0.07;
    let v = peak + (boxMuller(rng) * spread);
    v = Math.max(0, Math.min(1, v));
    if (v > bestComposite) bestComposite = v;
    const bin = Math.min(BIN_COUNT - 1, Math.floor(v * BIN_COUNT));
    histogram[bin]++;
  }
  // Scale histogram to represent the full explored count
  const scale = explored / SAMPLES;
  for (let i = 0; i < BIN_COUNT; i++) histogram[i] = Math.round(histogram[i] * scale);

  // Best-so-far curve: 24 log-spaced checkpoints, asymptotically approaching bestComposite
  const CHECKPOINTS = 24;
  const curve = [];
  let best = 0.4;
  for (let k = 0; k < CHECKPOINTS; k++) {
    const f = k / (CHECKPOINTS - 1);
    const at_n = Math.floor(Math.pow(explored, f));
    const jump = (bestComposite - best) * (0.18 + rng() * 0.12);
    best = Math.min(bestComposite, best + jump);
    curve.push({ at_n, composite: Number(best.toFixed(4)) });
  }

  // Top-10 winners
  const TOP = 10;
  const top = [];
  for (let i = 0; i < TOP; i++) {
    const variantRng = mulberry32(seedHash("top:" + i + ":" + seedSeq));
    const composite = Number((bestComposite - i * (0.004 + variantRng() * 0.003)).toFixed(4));
    const seq = mutate(seedSeq, 0.04 + variantRng() * 0.02, variantRng);
    const muts = diffMutations(seedSeq, seq);
    top.push({
      rank: i + 1,
      name: `${factor}-G∞.${i + 1}`,
      sequence: seq,
      composite,
      mutations_count: muts.length,
      mutations: muts,
    });
  }

  // Duration + throughput — pretend the search took ~4.2s wall + 5-15min cluster time
  const duration_ms = 4200;
  const variants_per_sec = Math.floor(explored / (duration_ms / 1000));

  return {
    budget_planned: planned,
    budget_explored: explored,
    histogram,
    best_so_far_curve: curve,
    top,
    duration_ms,
    variants_per_sec,
    factor,
  };
}

function boxMuller(rng) {
  const u = Math.max(1e-9, rng());
  const v = Math.max(1e-9, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── biochemistry / scientific specification ─────────────────────────────────
//
// Generates a plausible spec sheet for a sequence. Real values would come from
// pe-chemistry / pe-neural; these are derived from per-residue lookup tables
// (Kyte-Doolittle hydrophobicity, monoisotopic mass, pKa) plus deterministic
// random for predicted-by-model fields.

const AA_MASS = {
  A: 89.09, R: 174.20, N: 132.12, D: 133.10, C: 121.16, Q: 146.15, E: 147.13,
  G: 75.07, H: 155.16, I: 131.17, L: 131.17, K: 146.19, M: 149.21, F: 165.19,
  P: 115.13, S: 105.09, T: 119.12, W: 204.23, Y: 181.19, V: 117.15,
};
const AA_PKA_SIDE = { D: 3.65, E: 4.25, C: 8.33, Y: 10.07, H: 6.00, K: 10.53, R: 12.48 };
const AA_HYDRO = {
  A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4,
  H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8,
  T: -0.7, W: -0.9, Y: -1.3, V: 4.2,
};

const DOMAINS = {
  OCT4: [
    { name: "N-terminal transactivation", start: 1, end: 19, role: "transactivation" },
    { name: "POU-specific (POUs)", start: 20, end: 50, role: "DNA binding · DBD" },
    { name: "POU homeodomain (POUh)", start: 51, end: 76, role: "DNA binding · homeobox" },
  ],
  SOX2: [
    { name: "HMG-box DBD", start: 1, end: 40, role: "DNA binding · minor groove" },
    { name: "transactivation tail", start: 41, end: 76, role: "transactivation" },
  ],
  KLF4: [
    { name: "transactivation N", start: 1, end: 30, role: "transactivation" },
    { name: "C2H2 zinc finger 1", start: 31, end: 55, role: "DNA binding" },
    { name: "linker", start: 56, end: 76, role: "structural" },
  ],
  CMYC: [
    { name: "Myc Box I (MB-I)", start: 1, end: 22, role: "TRRAP recruitment" },
    { name: "Myc Box II (MB-II)", start: 23, end: 45, role: "transformation" },
    { name: "bHLH-Zip", start: 46, end: 76, role: "Max heterodimerisation" },
  ],
};

export function compute_specification(sequence) {
  const seq = sequence.toUpperCase();
  const n = seq.length;
  const rng = mulberry32(seedHash("spec:" + seq));
  const factor = factorOf(seq);

  // Composition
  const composition = {};
  for (const aa of "ACDEFGHIKLMNPQRSTVWY") composition[aa] = 0;
  for (const aa of seq) if (composition[aa] != null) composition[aa]++;

  // Molecular weight (peptide bond loses one H2O per linkage)
  let mw_da = 0;
  for (const aa of seq) mw_da += AA_MASS[aa] ?? 0;
  mw_da -= (n - 1) * 18.015;

  // Isoelectric point — bisection over pH where net charge = 0
  function netCharge(pH) {
    let q = 0;
    // N-terminus
    q += 1 / (1 + Math.pow(10, pH - 9.69));
    // C-terminus
    q -= 1 / (1 + Math.pow(10, 2.34 - pH));
    for (const aa of seq) {
      const pka = AA_PKA_SIDE[aa];
      if (!pka) continue;
      if ("DECY".includes(aa)) q -= 1 / (1 + Math.pow(10, pka - pH));
      else q += 1 / (1 + Math.pow(10, pH - pka));
    }
    return q;
  }
  let lo = 0, hi = 14;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (netCharge(mid) > 0) lo = mid; else hi = mid;
  }
  const pI = (lo + hi) / 2;
  const charge_pH7 = netCharge(7.0);

  // Hydrophobicity (Kyte-Doolittle, sliding window 9)
  const window = 9;
  const profile = [];
  for (let i = 0; i < n; i++) {
    const lo2 = Math.max(0, i - Math.floor(window / 2));
    const hi2 = Math.min(n, i + Math.floor(window / 2) + 1);
    let sum = 0, count = 0;
    for (let j = lo2; j < hi2; j++) { sum += AA_HYDRO[seq[j]] ?? 0; count++; }
    profile.push(Number((sum / count).toFixed(3)));
  }
  const avg_hydropathy = profile.length ? profile.reduce((a, b) => a + b, 0) / profile.length : 0;

  // Secondary structure (Chou-Fasman-ish percentages)
  const helixProp = { A: 1.42, L: 1.21, M: 1.45, E: 1.51, Q: 1.11, H: 1.0, K: 1.16, R: 0.98, F: 1.13, I: 1.08 };
  const sheetProp = { V: 1.7, I: 1.6, Y: 1.47, C: 1.19, W: 1.37, F: 1.38, T: 1.19, L: 1.30, M: 1.05 };
  let helix = 0, sheet = 0;
  for (const aa of seq) {
    if (helixProp[aa]) helix += helixProp[aa];
    if (sheetProp[aa]) sheet += sheetProp[aa];
  }
  const totalProp = Math.max(helix + sheet + n, 1);
  const helixPct = (helix / totalProp) * 100;
  const sheetPct = (sheet / totalProp) * 100;
  const coilPct = Math.max(0, 100 - helixPct - sheetPct);

  // Predicted Tm (melting), half-life, aggregation
  const tm_c = 45 + (helixPct * 0.4) + (avg_hydropathy + 4.5) * 1.2 + rng() * 6;
  const half_life_mammalian_h = Math.max(0.5, 12 + (mw_da / 1000) * 0.8 - composition.M * 2 + rng() * 4);
  const half_life_ecoli_min = Math.max(2, 30 + composition.A * 0.5 - composition.R * 0.8 + rng() * 10);
  const aggregation = Math.max(0, Math.min(1, 0.18 + (avg_hydropathy + 0.5) * 0.05 + rng() * 0.1));
  const disorder = Math.max(0, Math.min(1, 0.35 + (coilPct - 30) * 0.01 + rng() * 0.08));

  // Off-target + immunogenicity (synthetic)
  const off_target = Math.max(0, Math.min(1, 0.12 + rng() * 0.18));
  const immunogenicity = Math.max(0, Math.min(1, 0.25 + (composition.K + composition.R) * 0.005 + rng() * 0.1));

  // Binding affinity to canonical DNA motif (Kd estimate)
  const kd_nM = Math.max(0.1, 8 - (composition.R * 0.4) - (composition.K * 0.2) + rng() * 2);

  // Domain table
  const domains = (DOMAINS[factor] ?? []).map((d) => ({
    ...d,
    coverage_pct: Math.round(Math.min(d.end, n) > d.start ? ((Math.min(d.end, n) - d.start + 1) / (d.end - d.start + 1)) * 100 : 0),
  }));

  return {
    sequence: seq,
    length: n,
    factor,
    mw_da: Number(mw_da.toFixed(2)),
    pI: Number(pI.toFixed(2)),
    charge_pH7: Number(charge_pH7.toFixed(2)),
    avg_hydropathy: Number(avg_hydropathy.toFixed(3)),
    hydropathy_profile: profile,
    composition,
    secondary_structure: {
      helix_pct: Number(helixPct.toFixed(1)),
      sheet_pct: Number(sheetPct.toFixed(1)),
      coil_pct: Number(coilPct.toFixed(1)),
    },
    predictions: {
      melting_temp_c: Number(tm_c.toFixed(1)),
      half_life_mammalian_h: Number(half_life_mammalian_h.toFixed(1)),
      half_life_ecoli_min: Number(half_life_ecoli_min.toFixed(1)),
      aggregation_propensity: Number(aggregation.toFixed(3)),
      intrinsic_disorder: Number(disorder.toFixed(3)),
      off_target_risk: Number(off_target.toFixed(3)),
      immunogenicity_risk: Number(immunogenicity.toFixed(3)),
      dna_binding_kd_nM: Number(kd_nM.toFixed(2)),
    },
    domains,
  };
}

export function compliance_check(sequence, brief_json) {
  const seq = sequence.toUpperCase();
  const brief = JSON.parse(brief_json || "{}");
  const checks = [];

  // Length
  checks.push({
    rule: `length ≤ ${brief.max_length}`,
    passed: seq.length <= (brief.max_length ?? 1e9),
    detail: `${seq.length} residues`,
  });

  // Forbidden residues
  if (brief.forbidden_residues) {
    const forbidden = brief.forbidden_residues.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    const hits = forbidden.filter((aa) => seq.includes(aa));
    checks.push({
      rule: `no forbidden residues [${forbidden.join(", ")}]`,
      passed: hits.length === 0,
      detail: hits.length === 0 ? "absent" : `present: ${hits.join(", ")}`,
    });
  }

  // Required motifs
  if (brief.required_motifs) {
    const motifs = brief.required_motifs.split(",").map((s) => s.trim()).filter(Boolean);
    for (const m of motifs) {
      let found = false;
      try { found = new RegExp(m).test(seq); } catch { found = seq.includes(m); }
      checks.push({
        rule: `motif "${m}" present`,
        passed: found,
        detail: found ? "matched" : "absent",
      });
    }
  }

  // Target factor (winner's predicted factor matches brief)
  const winnerFactor = factorOf(seq);
  checks.push({
    rule: `target factor = ${brief.target_factor}`,
    passed: winnerFactor === brief.target_factor,
    detail: `engine classified as ${winnerFactor}`,
  });

  const passed = checks.filter((c) => c.passed).length;
  return {
    total: checks.length,
    passed,
    failed: checks.length - passed,
    checks,
  };
}

// ── HNSW similarity search (fake) ────────────────────────────────────────────
export function search_similar(sequence, k) {
  const rng = mulberry32(seedHash("similar:" + sequence));
  const targetFactor = factorOf(sequence);
  const out = [];
  for (let i = 0; i < Math.min(k, 12); i++) {
    const sim = 1 - (i * 0.06 + rng() * 0.04);
    out.push({
      id: `var-${i + 1}-${Math.floor(rng() * 0xffff).toString(16).padStart(4, "0")}`,
      similarity: Number(sim.toFixed(4)),
      target_factor: targetFactor,
      generation: Math.floor(rng() * 8),
    });
  }
  return out;
}

// ── quantum VQE ──────────────────────────────────────────────────────────────
export function run_local_quantum_sim(hamiltonian_json) {
  const h = JSON.parse(hamiltonian_json || "{}");
  const rng = mulberry32(seedHash(JSON.stringify(h)));
  const iterations = 40 + Math.floor(rng() * 20);
  const ground = -1.137 - rng() * 0.2;
  const convergence = [];
  let energy = ground + 0.8;
  for (let i = 0; i < iterations; i++) {
    energy -= (energy - ground) * (0.08 + rng() * 0.02);
    convergence.push({ iter: i, energy: Number(energy.toFixed(5)) });
  }
  return {
    ground_state_energy: Number(ground.toFixed(5)),
    optimal_parameters: Array.from({ length: 4 }, () => Number((rng() - 0.5).toFixed(4))),
    converged: true,
    iterations,
    convergence,
    backend: rng() < 0.7 ? "local-statevector" : "chemiq-sidecar",
    qubits: h.num_qubits ?? 4,
  };
}

// ── ledger / witness chain ───────────────────────────────────────────────────
const LEDGER_HEAD = "9a3f81";
const TEE_VENDORS = ["intel-sgx", "amd-sev", "arm-cca"];

function fakeHash(seed, n) {
  const rng = mulberry32(seedHash(seed));
  let s = "";
  for (let i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(rng() * 16)];
  return s;
}

export function verify_ledger() {
  return {
    valid: true,
    head: LEDGER_HEAD,
    entry_count: 17,
  };
}

export function ledger_entries(limit, offset) {
  const start = offset ?? 0;
  const n = limit ?? 12;
  const out = [];
  const labels = [
    "genesis", "import.oct4", "score.batch", "evolve.gen1", "evolve.gen2",
    "promote.v1.3", "promote.v1.7", "evolve.gen3", "score.batch", "promote.v3.2",
    "evolve.gen4", "witness.attest", "evolve.gen5", "promote.v5.1", "tee.refresh",
    "score.batch", "evolve.gen6",
  ];
  for (let i = 0; i < n; i++) {
    const idx = start + i;
    if (idx >= labels.length) break;
    out.push({
      index: idx,
      hash: fakeHash("e" + idx, 12),
      parent_hash: idx === 0 ? null : fakeHash("e" + (idx - 1), 12),
      label: labels[idx],
      ts: 1715000000000 + idx * 60000,
      witness_signature: fakeHash("w" + idx, 16),
      witnessed_by: ["alpha-witness", "beta-witness", "gamma-witness"].slice(0, 2 + (idx % 2)),
      tee_attestation: {
        vendor: TEE_VENDORS[idx % 3],
        valid: idx % 7 !== 6,
      },
    });
  }
  return out;
}

// ── ESM-2 embeddings (mock 320-dim) ──────────────────────────────────────────
export function embed_sequence(sequence) {
  const rng = mulberry32(seedHash("embed:" + sequence));
  const v = new Array(320);
  for (let i = 0; i < 320; i++) v[i] = (rng() - 0.5) * 2;
  return { dim: 320, values: v };
}

// 2D projection (UMAP-ish: simply hash sequence to deterministic xy)
export function project_embeddings(sequences) {
  return sequences.map((seq) => {
    const r1 = mulberry32(seedHash("x:" + seq));
    const r2 = mulberry32(seedHash("y:" + seq));
    return {
      sequence: seq,
      x: r1() * 2 - 1,
      y: r2() * 2 - 1,
      factor: factorOf(seq),
    };
  });
}

// ── HNSW graph (3-layer fake) ────────────────────────────────────────────────
export function hnsw_neighbours(sequence, k) {
  const rng = mulberry32(seedHash("hnsw:" + sequence));
  const layers = [];
  for (let l = 2; l >= 0; l--) {
    const nodeCount = l === 2 ? 4 : l === 1 ? 8 : 16;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `L${l}-n${i}`,
        x: (rng() * 0.8 + 0.1) * 100,
        y: (rng() * 0.8 + 0.1) * 100,
        is_visit: i < (k ?? 5) && (l === 0 ? i < (k ?? 5) : i < 2),
      });
    }
    layers.push({ layer: l, nodes });
  }
  return { layers, query: sequence.slice(0, 12) };
}

// ── RVF — segment table mock ─────────────────────────────────────────────────
const SEGMENTS = [
  { id: 0x00, name: "MANIFEST_SEG", size: 412, summary: "version=1.4 · parent=9a3f81 · capabilities=[score,evolve,vqe,witness]" },
  { id: 0x01, name: "VEC_SEG", size: 1_310_720, summary: "320-dim ESM-2 · 1024 entries" },
  { id: 0x02, name: "INDEX_SEG", size: 196_608, summary: "HNSW · M=16 · ef=200 · 3 layers" },
  { id: 0x03, name: "OVERLAY_SEG", size: 8_192, summary: "LoRA rank-8 · 4 adapters" },
  { id: 0x04, name: "JOURNAL_SEG", size: 4_096, summary: "17 entries · head=9a3f81" },
  { id: 0x05, name: "GRAPH_SEG", size: 16_384, summary: "GNN · 312 nodes · 1.8k edges" },
  { id: 0x06, name: "QUANT_SEG", size: 524_288, summary: "INT8 quantized · scale=0.0078" },
  { id: 0x07, name: "META_SEG", size: 2_048, summary: "filterable · 8 columns" },
  { id: 0x08, name: "HOT_SEG", size: 32_768, summary: "top-100 promoted candidates" },
  { id: 0x09, name: "SKETCH_SEG", size: 4_096, summary: "MinHash 128 bands · VQE snapshots" },
  { id: 0x0a, name: "WASM_SEG", size: 5_632, summary: "microkernel · 5.5 KB" },
  { id: 0x0b, name: "WITNESS_SEG", size: 6_144, summary: "QuDAG · 17 chained witness signatures" },
  { id: 0x0c, name: "CRYPTO_SEG", size: 2_048, summary: "TEE attestation · intel-sgx" },
  { id: 0x0d, name: "META_IDX_SEG", size: 1_024, summary: "8 indices over META_SEG" },
  { id: 0x0e, name: "KERNEL_SEG", size: 0, summary: "(optional unikernel · absent)" },
];

export function load_rvf(data) {
  return {
    vectors_loaded: 1024,
    journal_entries: 17,
    segments: SEGMENTS.map((s) => ({ id: s.id, name: s.name, size_bytes: s.size })),
    bytes_received: data?.length ?? 0,
  };
}

export function rvf_segments() {
  return SEGMENTS;
}

export function rvf_segment_detail(id) {
  const seg = SEGMENTS.find((s) => s.id === id);
  if (!seg) return null;
  if (id === 0x01) {
    // VEC_SEG — sample 6 vectors with small values
    const rng = mulberry32(0x01);
    return {
      ...seg,
      detail: {
        sample: Array.from({ length: 6 }, (_, i) => ({
          id: `vec-${i}`,
          first_4: Array.from({ length: 4 }, () => Number((rng() - 0.5).toFixed(4))),
        })),
      },
    };
  }
  if (id === 0x02) {
    return {
      ...seg,
      detail: { M: 16, ef_construction: 200, layers: 3, node_count: 1024 },
    };
  }
  if (id === 0x08) {
    return {
      ...seg,
      detail: {
        top: Array.from({ length: 8 }, (_, i) => ({
          rank: i + 1,
          name: `${Object.keys(FACTORS)[i % 4]}-v${(i + 1)}.${i % 3}`,
          composite: Number((0.92 - i * 0.025).toFixed(3)),
        })),
      },
    };
  }
  if (id === 0x09) {
    return {
      ...seg,
      detail: {
        bands: 128,
        rows_per_band: 4,
        bands_preview: Array.from({ length: 8 }, (_, i) => ({
          band: i,
          hash: fakeHash("b" + i, 8),
        })),
      },
    };
  }
  if (id === 0x0b) {
    return {
      ...seg,
      detail: { signatures: ledger_entries(8, 0).map((e) => e.witness_signature) },
    };
  }
  return { ...seg, detail: null };
}

// ── governance policies ──────────────────────────────────────────────────────
const POLICIES = [
  { id: "safety-floor", name: "Safety score floor", rule: "safety_score >= 0.6", active: true, severity: "block" },
  { id: "promote-witness", name: "Promotion requires witnesses", rule: "promote requires ≥2 witness signatures", active: true, severity: "block" },
  { id: "evolution-rate", name: "Evolution rate limit", rule: "≤10 cycles/hour per session", active: true, severity: "throttle" },
  { id: "quantum-budget", name: "Quantum budget", rule: "≤500 VQE iterations/cycle", active: true, severity: "throttle" },
  { id: "tee-required", name: "TEE attestation required", rule: "promote requires valid TEE attestation", active: false, severity: "block" },
];

const AUDIT = [
  { ts: 1715000000000, policy: "safety-floor", action: "blocked", subject: "evolve.gen2:v2.4", reason: "safety_score=0.51" },
  { ts: 1715000060000, policy: "promote-witness", action: "allowed", subject: "promote.v1.3", reason: "2 witnesses" },
  { ts: 1715000120000, policy: "evolution-rate", action: "throttled", subject: "evolve.gen7", reason: "10/h reached, queued" },
  { ts: 1715000180000, policy: "quantum-budget", action: "allowed", subject: "vqe.batch", reason: "iters=42/500" },
  { ts: 1715000240000, policy: "safety-floor", action: "blocked", subject: "evolve.gen3:v3.7", reason: "safety_score=0.43" },
];

export function list_policies() {
  return POLICIES;
}

export function list_audit_events(limit) {
  return AUDIT.slice(0, limit ?? AUDIT.length);
}

// ── chemiq sidecar health ────────────────────────────────────────────────────
export function sidecar_health() {
  return {
    url: "http://chemiq-sidecar:8100",
    reachable: true,
    version: "0.4.2",
    backends_available: ["pyscf", "qiskit-nature"],
    last_ping_ms: 8,
  };
}

// ── factors ──────────────────────────────────────────────────────────────────
export function yamanaka_factors() {
  return Object.values(FACTORS);
}

// ── live event stream — synthesised ticks ───────────────────────────────────
let liveIdx = 0;
const LIVE_EVENTS = [
  { kind: "score.start", label: "scoring OCT4-v3.1" },
  { kind: "score.done", label: "OCT4-v3.1 composite=0.811" },
  { kind: "evolve.tick", label: "gen=4 · scored 6/8" },
  { kind: "evolve.tick", label: "gen=4 · scored 8/8" },
  { kind: "promote", label: "OCT4-v4.2 promoted (comp=0.834)" },
  { kind: "ledger.append", label: "journal head=9a3f81 (+1)" },
  { kind: "witness.attest", label: "alpha-witness signed e17" },
  { kind: "vqe.iter", label: "VQE iter=23 · energy=-1.122" },
  { kind: "vqe.done", label: "VQE converged · ground=-1.132 Ha" },
  { kind: "policy.allow", label: "promote-witness · allowed v4.2" },
];

export function next_live_event() {
  const e = LIVE_EVENTS[liveIdx % LIVE_EVENTS.length];
  liveIdx++;
  return { ...e, ts: Date.now() };
}

// ── init ────────────────────────────────────────────────────────────────────
export function init() { /* no-op for stub */ }

export default {};
