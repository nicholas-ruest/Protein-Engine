// Procedural 3D backbone for a protein sequence.
//
// We don't have real coordinates (no PDB), so we generate a plausible
// helix/strand alternation: every amino acid is plotted on a Ramachandran-like
// twisted ribbon. The output is identical for the same sequence (deterministic).

import * as THREE from "three";

const AA_KYTE_DOOLITTLE: Record<string, number> = {
  A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4,
  H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8,
  T: -0.7, W: -0.9, Y: -1.3, V: 4.2,
};

const FACTOR_COLOR: Record<string, number> = {
  OCT4: 0x7c9cff,
  SOX2: 0x4fd1c5,
  KLF4: 0xfbbf24,
  CMYC: 0xf87171,
};

export interface BuildBackboneOptions {
  sequence: string;
  factor?: string;
  mutationPositions?: Set<number>;
  scale?: number;
  highlight?: number; // residue index to spotlight
}

export interface BackboneHandle {
  group: THREE.Group;
  residues: THREE.Mesh[];
  centers: THREE.Vector3[];
}

export function buildBackbone(opts: BuildBackboneOptions): BackboneHandle {
  const seq = opts.sequence;
  const scale = opts.scale ?? 1;
  const group = new THREE.Group();

  // Plot residue centers in a twisting helix that occasionally flips to a strand
  const centers: THREE.Vector3[] = [];
  let phi = 0;
  let z = -seq.length * 0.18 * scale;
  let strandMode = false;
  for (let i = 0; i < seq.length; i++) {
    if (i % 12 === 0) strandMode = !strandMode;
    const radius = strandMode ? 0.6 : 1.6;
    const dPhi = strandMode ? 0.25 : 1.0;
    const dz = strandMode ? 0.42 : 0.34;
    phi += dPhi;
    z += dz * scale;
    centers.push(new THREE.Vector3(Math.cos(phi) * radius * scale, Math.sin(phi) * radius * scale, z));
  }

  // Backbone ribbon as tube along centers
  const curve = new THREE.CatmullRomCurve3(centers);
  const tubeGeom = new THREE.TubeGeometry(curve, Math.max(centers.length * 4, 100), 0.16 * scale, 12, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x2a3358, roughness: 0.45, metalness: 0.05,
  });
  group.add(new THREE.Mesh(tubeGeom, tubeMat));

  // Residue spheres
  const baseColor = FACTOR_COLOR[opts.factor ?? ""] ?? 0x7c9cff;
  const residues: THREE.Mesh[] = [];
  for (let i = 0; i < centers.length; i++) {
    const aa = seq[i];
    const hydro = AA_KYTE_DOOLITTLE[aa] ?? 0;
    const isMut = opts.mutationPositions?.has(i + 1) ?? false;
    const isHi = opts.highlight === i + 1;
    const colour = new THREE.Color(baseColor).lerp(new THREE.Color(0xffffff), (hydro + 4.5) / 9 * 0.4);
    const mat = new THREE.MeshStandardMaterial({
      color: isMut ? 0xfbbf24 : colour,
      emissive: isMut ? 0xfbbf24 : (isHi ? 0xffffff : 0x000000),
      emissiveIntensity: isMut ? 0.45 : (isHi ? 0.3 : 0),
      roughness: 0.35,
      metalness: 0.1,
    });
    const geom = new THREE.SphereGeometry(isMut || isHi ? 0.34 * scale : 0.24 * scale, 14, 12);
    const sphere = new THREE.Mesh(geom, mat);
    sphere.position.copy(centers[i]);
    sphere.userData = { residue: aa, position: i + 1 };
    residues.push(sphere);
    group.add(sphere);
  }

  // Center the model
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);

  return { group, residues, centers };
}

export const FACTOR_COLOR_MAP = FACTOR_COLOR;
