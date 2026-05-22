import * as THREE from "three";
import { Scene } from "../three/Scene";
import type { QuantumResult } from "../transport/types";

export function BlochSphere(props: { result?: QuantumResult; height?: number }) {
  return (
    <Scene
      height={props.height ?? 360}
      controls="orbit"
      setup={(ctx) => {
        const group = new THREE.Group();

        // Sphere wireframe
        const sphereGeom = new THREE.SphereGeometry(3, 32, 24);
        const wire = new THREE.LineSegments(
          new THREE.EdgesGeometry(sphereGeom),
          new THREE.LineBasicMaterial({ color: 0x283057, transparent: true, opacity: 0.6 }),
        );
        group.add(wire);
        const surf = new THREE.Mesh(
          sphereGeom,
          new THREE.MeshStandardMaterial({
            color: 0x1a2240, transparent: true, opacity: 0.25, roughness: 0.6,
          }),
        );
        group.add(surf);

        // Axes
        const axisLength = 4;
        const axes: Array<[THREE.Vector3, number, string]> = [
          [new THREE.Vector3(1, 0, 0), 0xf87171, "X"],
          [new THREE.Vector3(0, 1, 0), 0x4fd1c5, "Y"],
          [new THREE.Vector3(0, 0, 1), 0x7c9cff, "Z"],
        ];
        for (const [dir, color] of axes) {
          const start = dir.clone().multiplyScalar(-axisLength);
          const end = dir.clone().multiplyScalar(axisLength);
          const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
          group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })));
        }

        // State vector derived from VQE optimal parameters (or random)
        const params = props.result?.optimal_parameters ?? [0.3, 0.5, 0.8, 0.2];
        const theta = (params[0] ?? 0.5) * Math.PI;
        const phi = (params[1] ?? 0.5) * Math.PI * 2;
        const stateVec = new THREE.Vector3(
          Math.sin(theta) * Math.cos(phi) * 3,
          Math.cos(theta) * 3,
          Math.sin(theta) * Math.sin(phi) * 3,
        );

        const arrowDir = stateVec.clone().normalize();
        const arrow = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), 3, 0xfbbf24, 0.45, 0.25);
        group.add(arrow);

        // State endpoint marker
        const endMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 16, 12),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.7 }),
        );
        endMarker.position.copy(stateVec);
        group.add(endMarker);

        // |0⟩ and |1⟩ labels via small spheres
        const lbl0 = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 12, 8),
          new THREE.MeshBasicMaterial({ color: 0x4ade80 }),
        );
        lbl0.position.set(0, 3.2, 0);
        const lbl1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 12, 8),
          new THREE.MeshBasicMaterial({ color: 0xf87171 }),
        );
        lbl1.position.set(0, -3.2, 0);
        group.add(lbl0, lbl1);

        ctx.scene.add(group);
        ctx.camera.position.set(6, 4, 8);
        return { dispose: () => ctx.scene.remove(group) };
      }}
    />
  );
}
