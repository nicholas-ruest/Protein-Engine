import * as THREE from "three";
import { Scene } from "../three/Scene";
import type { ProjectedPoint } from "../transport/types";

const FACTOR_HEX: Record<string, number> = {
  OCT4: 0x7c9cff,
  SOX2: 0x4fd1c5,
  KLF4: 0xfbbf24,
  CMYC: 0xf87171,
};

export function EmbeddingScatter3D(props: {
  points: ProjectedPoint[];
  highlight?: string;
  height?: number;
}) {
  return (
    <Scene
      height={props.height ?? 380}
      controls="orbit"
      setup={(ctx) => {
        const group = new THREE.Group();

        // Axes
        const axes = new THREE.AxesHelper(6);
        (axes.material as THREE.Material).transparent = true;
        (axes.material as THREE.Material).opacity = 0.35;
        group.add(axes);

        // Grid
        const grid = new THREE.GridHelper(12, 12, 0x283057, 0x1a2240);
        (grid.material as THREE.Material).opacity = 0.4;
        (grid.material as THREE.Material).transparent = true;
        grid.position.y = -6;
        group.add(grid);

        // Plot points
        const geom = new THREE.SphereGeometry(0.18, 14, 12);
        for (const p of props.points) {
          const isHi = props.highlight === p.sequence;
          const color = FACTOR_HEX[p.factor] ?? 0xffffff;
          const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: isHi ? 0xffffff : color,
            emissiveIntensity: isHi ? 0.6 : 0.25,
            roughness: 0.3,
          });
          // Derive a synthetic z from x+y for 3D feel
          const z = Math.sin(p.x * 3.1) * Math.cos(p.y * 2.3) * 3;
          const m = new THREE.Mesh(geom, mat);
          m.scale.setScalar(isHi ? 1.7 : 1);
          m.position.set(p.x * 5, z, p.y * 5);
          group.add(m);

          // Trail line from origin (axis-style indicator)
          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(p.x * 5, -6, p.y * 5),
            new THREE.Vector3(p.x * 5, z, p.y * 5),
          ]);
          const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 });
          group.add(new THREE.Line(lineGeom, lineMat));
        }

        ctx.scene.add(group);
        ctx.camera.position.set(10, 8, 14);
        return { dispose: () => ctx.scene.remove(group) };
      }}
    />
  );
}
