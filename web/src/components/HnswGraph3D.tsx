import * as THREE from "three";
import { Show } from "solid-js";
import { Scene } from "../three/Scene";
import type { HnswGraph as HnswGraphData } from "../transport/types";

export function HnswGraph3D(props: { data?: HnswGraphData; height?: number }) {
  return (
    <Show when={props.data} fallback={<div class="muted">run a similarity search to populate</div>}>
      <Scene
        height={props.height ?? 380}
        controls="orbit"
        setup={(ctx) => {
          const group = new THREE.Group();
          const layers = props.data!.layers;
          const layerCount = layers.length;
          const layerGap = 4;

          // Layer planes
          for (let i = 0; i < layerCount; i++) {
            const plane = new THREE.Mesh(
              new THREE.PlaneGeometry(10, 10),
              new THREE.MeshBasicMaterial({
                color: 0x283057,
                transparent: true,
                opacity: 0.12,
                side: THREE.DoubleSide,
              }),
            );
            plane.position.y = i * layerGap - (layerCount - 1) * layerGap / 2;
            plane.rotation.x = -Math.PI / 2;
            group.add(plane);
          }

          // Plot nodes layer by layer
          const positions = new Map<string, THREE.Vector3>();
          const sphereGeom = new THREE.SphereGeometry(0.22, 14, 12);
          layers.forEach((layer, lIdx) => {
            const y = lIdx * layerGap - (layerCount - 1) * layerGap / 2;
            for (const n of layer.nodes) {
              const x = (n.x / 100 - 0.5) * 10;
              const z = (n.y / 100 - 0.5) * 10;
              const pos = new THREE.Vector3(x, y, z);
              positions.set(n.id, pos);
              const mat = new THREE.MeshStandardMaterial({
                color: n.is_visit ? 0x7c9cff : 0x4fd1c5,
                emissive: n.is_visit ? 0x7c9cff : 0x000000,
                emissiveIntensity: n.is_visit ? 0.7 : 0,
                roughness: 0.3,
              });
              const m = new THREE.Mesh(sphereGeom, mat);
              m.scale.setScalar(n.is_visit ? 1.6 : 1);
              m.position.copy(pos);
              group.add(m);
            }
          });

          // Vertical link between visited nodes across adjacent layers (traversal)
          const visited = layers.flatMap((l) => l.nodes.filter((n) => n.is_visit).map((n) => n.id));
          for (let i = 0; i < visited.length - 1; i++) {
            const a = positions.get(visited[i]);
            const b = positions.get(visited[i + 1]);
            if (!a || !b) continue;
            const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
            const mat = new THREE.LineBasicMaterial({ color: 0x7c9cff, transparent: true, opacity: 0.7 });
            group.add(new THREE.Line(geo, mat));
          }

          // Layer labels (using small sprite-like planes)
          ctx.scene.add(group);
          ctx.camera.position.set(8, 6, 12);
          return { dispose: () => ctx.scene.remove(group) };
        }}
      />
    </Show>
  );
}
