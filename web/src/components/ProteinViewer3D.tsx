import { createMemo } from "solid-js";
import { Scene } from "../three/Scene";
import { buildBackbone } from "../three/protein";

export function ProteinViewer3D(props: {
  sequence: string;
  factor?: string;
  parent?: string;
  height?: number;
  spin?: boolean;
  highlight?: number;
}) {
  // Compute mutation positions vs parent (if provided)
  const muts = createMemo(() => {
    if (!props.parent) return new Set<number>();
    const out = new Set<number>();
    const n = Math.min(props.parent.length, props.sequence.length);
    for (let i = 0; i < n; i++) {
      if (props.parent[i] !== props.sequence[i]) out.add(i + 1);
    }
    return out;
  });

  return (
    <Scene
      height={props.height ?? 360}
      controls={props.spin ? "spin" : "orbit"}
      setup={(ctx) => {
        const { group } = buildBackbone({
          sequence: props.sequence,
          factor: props.factor,
          mutationPositions: muts(),
          highlight: props.highlight,
          scale: 1.1,
        });
        ctx.scene.add(group);
        return { dispose: () => ctx.scene.remove(group) };
      }}
    />
  );
}
