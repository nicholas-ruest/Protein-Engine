// Solid wrapper around a Three.js scene. Owns the renderer, camera, controls,
// resize handling, and animation loop. Children mount on the returned scene.
//
// Usage:
//   <Scene height={420} setup={(ctx) => mountMyObjects(ctx)} />
//
// `setup` is called once when the scene is ready and may return an object with
// `frame(ctx, dt)` to participate in the animation loop.

import { onCleanup, onMount, type JSX } from "solid-js";
import * as THREE from "three";

export interface SceneCtx {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  container: HTMLDivElement;
}

export interface SceneHandle {
  frame?: (ctx: SceneCtx, t: number) => void;
  dispose?: () => void;
}

export function Scene(props: {
  height?: number;
  background?: number;
  setup: (ctx: SceneCtx) => SceneHandle | void;
  controls?: "orbit" | "spin" | "none";
}): JSX.Element {
  let container!: HTMLDivElement;
  let raf = 0;

  onMount(() => {
    const w = container.clientWidth || 600;
    const h = props.height ?? 360;

    const scene = new THREE.Scene();
    scene.background = props.background == null ? null : new THREE.Color(props.background);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    const ctx: SceneCtx = { scene, camera, renderer, container };
    const handle = props.setup(ctx) ?? {};

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(10, 14, 10);
    const rim = new THREE.DirectionalLight(0x7c9cff, 0.35);
    rim.position.set(-8, -4, -6);
    scene.add(ambient, key, rim);

    // Controls (simple mouse-drag orbit + zoom; auto-spin if requested)
    let rotateY = 0, rotateX = -0.15;
    let dragging = false;
    let lastX = 0, lastY = 0;
    let zoom = 1;
    const target = new THREE.Vector3();
    const baseDist = 18;

    const onDown = (e: PointerEvent) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      container.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      rotateY += (e.clientX - lastX) * 0.01;
      rotateX = Math.max(-1.2, Math.min(1.2, rotateX + (e.clientY - lastY) * 0.01));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => { dragging = false; container.releasePointerCapture(e.pointerId); };
    const onWheel = (e: WheelEvent) => { zoom = Math.max(0.3, Math.min(3, zoom * (1 + e.deltaY * 0.001))); e.preventDefault(); };

    if (props.controls !== "none") {
      container.addEventListener("pointerdown", onDown);
      container.addEventListener("pointermove", onMove);
      container.addEventListener("pointerup", onUp);
      container.addEventListener("wheel", onWheel, { passive: false });
    }

    const onResize = () => {
      const ww = container.clientWidth || w;
      camera.aspect = ww / h;
      camera.updateProjectionMatrix();
      renderer.setSize(ww, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      if (props.controls === "spin") rotateY = t * 0.35;
      camera.position.set(
        baseDist * zoom * Math.sin(rotateY) * Math.cos(rotateX),
        baseDist * zoom * Math.sin(rotateX),
        baseDist * zoom * Math.cos(rotateY) * Math.cos(rotateX),
      );
      camera.lookAt(target);
      handle?.frame?.(ctx, t);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    onCleanup(() => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("wheel", onWheel);
      handle?.dispose?.();
      renderer.dispose();
      scene.traverse((o) => {
        // @ts-ignore — geometry/material are present on mesh-like objects
        o.geometry?.dispose?.();
        // @ts-ignore
        const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        for (const m of mats) m.dispose?.();
      });
      renderer.domElement.remove();
    });
  });

  return <div ref={container!} class="three-host" style={`height:${props.height ?? 360}px`} />;
}
