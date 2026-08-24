"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Compact 3D Simplex noise (public-domain algorithm, Stefan Gustavson /
// Ashima Arts) — used to displace the brain mesh's surface into organic
// gyri/sulci folds. Self-contained (no npm dependency) and deterministically
// seeded so the brain's fold pattern is stable across renders.
class SimplexNoise3D {
  private perm = new Uint8Array(512);
  private permMod12 = new Uint8Array(512);
  private static grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
  ] as const;

  constructor(seed: number) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    const rand = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  noise3D(xin: number, yin: number, zin: number): number {
    const { grad3, } = SimplexNoise3D;
    const { perm, permMod12 } = this;
    const F3 = 1 / 3, G3 = 1 / 6;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const X0 = i - t, Y0 = j - t, Z0 = k - t;
    const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    const gi0 = permMod12[ii + perm[jj + perm[kk]]];
    const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
    const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
    const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];

    const contrib = (t0: number, gi: number, x: number, y: number, z: number) => {
      let t = t0 - x * x - y * y - z * z;
      if (t < 0) return 0;
      t *= t;
      const g = grad3[gi];
      return t * t * (g[0] * x + g[1] * y + g[2] * z);
    };
    const n0 = contrib(0.6, gi0, x0, y0, z0);
    const n1 = contrib(0.6, gi1, x1, y1, z1);
    const n2 = contrib(0.6, gi2, x2, y2, z2);
    const n3 = contrib(0.6, gi3, x3, y3, z3);
    return 32 * (n0 + n1 + n2 + n3);
  }
}

// Procedural brain mesh: an icosphere displaced with layered simplex noise
// for gyri-like folds, pinched inward along the x=0 plane for the
// longitudinal fissure between hemispheres, then squashed into a brain-ish
// oval. Vertex colors blend brand blue (left) into brand purple (right).
// A single noise-displaced sphere reads as an asteroid, not a brain — the
// base topology (one round blob) is wrong regardless of how the surface is
// textured. This instead assembles the recognizable landmarks: two
// elongated hemisphere lobes with a gap between them (the longitudinal
// fissure) and a smaller cerebellum lobe tucked underneath at the back —
// then gives each lobe a gentle noise-driven gyri texture on top.
// Plain smooth noise displaces vertices into random blobby bumps — real
// gyri are elongated ridges and valleys, closer to a network of veins than
// a bag of marbles. "Ridged" noise (fold each octave around its zero
// crossing, sharpen it, then feed the previous octave's strength into the
// next octave's weight) is the standard terrain-generation trick for that
// ridge/valley character, and reads far more like organic folds here too.
function ridgedNoise(noise: SimplexNoise3D, x: number, y: number, z: number, octaves: number): number {
  let sum = 0;
  let freq = 1.0;
  let amp = 0.5;
  let weight = 1.0;
  for (let o = 0; o < octaves; o++) {
    let n = noise.noise3D(x * freq, y * freq, z * freq);
    n = 1 - Math.abs(n);
    n *= n;
    n *= weight;
    weight = THREE.MathUtils.clamp(n * 1.8, 0, 1);
    sum += n * amp;
    freq *= 2.05;
    amp *= 0.55;
  }
  return sum;
}

interface LobeOptions {
  ridgeFreq: number;
  ridgeAmp: number;
  octaves: number;
  // Which side (in local space, before translation) faces the opposite
  // hemisphere: +1 carves in on +x, -1 carves in on -x, 0 = no carve (used
  // for lobes that aren't split down a midline, e.g. temporal lobes/cerebellum).
  medialSide?: number;
  medialCarve?: number;
}

function createLobeGeometry(detail: number, seed: number, color: THREE.Color, options: LobeOptions): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const noise = new SimplexNoise3D(seed);
  const pos = geometry.attributes.position;
  const colorArray = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let idx = 0; idx < pos.count; idx++) {
    v.fromBufferAttribute(pos, idx);
    n.copy(v).normalize();

    // Two displacement bands: a coarse pass for the major gyri, and a
    // higher-frequency, lower-amplitude second pass layered on top for
    // finer secondary wrinkling — real cortex has folds within folds, a
    // single noise band reads as one uniform bump size everywhere.
    const primary = ridgedNoise(noise, n.x * options.ridgeFreq, n.y * options.ridgeFreq, n.z * options.ridgeFreq, options.octaves);
    const secondary = ridgedNoise(noise, n.x * options.ridgeFreq * 3.4 + 12.5, n.y * options.ridgeFreq * 3.4, n.z * options.ridgeFreq * 3.4, 2);
    const bump = (primary - 0.42) * options.ridgeAmp + (secondary - 0.42) * options.ridgeAmp * 0.22;

    // Flatten the underside slightly (brains rest on a relatively flat
    // base rather than being fully round) — pull inward vertices whose
    // normal points downward.
    const flatten = Math.max(0, -n.y) * 0.18;

    // Carve the longitudinal fissure — without this the two hemisphere
    // lobes just blend into one smooth blob wherever they overlap.
    const medial = options.medialCarve && options.medialSide
      ? Math.max(0, options.medialSide * n.x) * options.medialCarve
      : 0;

    const scale = 1 + bump - flatten - medial;
    pos.setXYZ(idx, v.x * scale, v.y * scale, v.z * scale);

    colorArray[idx * 3] = color.r;
    colorArray[idx * 3 + 1] = color.g;
    colorArray[idx * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createBrainstemGeometry(color: THREE.Color): THREE.BufferGeometry {
  // IcosahedronGeometry (used for every other lobe) is non-indexed by
  // default, but CylinderGeometry is indexed — mergeGeometries requires
  // all-or-nothing, so convert this one to match.
  const geometry = new THREE.CylinderGeometry(0.055, 0.095, 0.34, 14, 1).toNonIndexed();
  const pos = geometry.attributes.position;
  const colorArray = new Float32Array(pos.count * 3);
  for (let idx = 0; idx < pos.count; idx++) {
    colorArray[idx * 3] = color.r;
    colorArray[idx * 3 + 1] = color.g;
    colorArray[idx * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
  return geometry;
}

function createBrainGeometry(): THREE.BufferGeometry {
  const colorLeft = new THREE.Color("#5B7CFF");
  const colorRight = new THREE.Color("#9B6BF0");
  const colorCerebellum = new THREE.Color("#7C93FF");
  const colorStem = new THREE.Color("#6B6BA8");

  const cerebrumOptions = { ridgeFreq: 2.9, ridgeAmp: 0.32, octaves: 4 };
  const temporalOptions = { ridgeFreq: 3.4, ridgeAmp: 0.16, octaves: 3 };
  const cerebellumOptions = { ridgeFreq: 7.2, ridgeAmp: 0.2, octaves: 3 };

  // Cerebrum: two hemisphere lobes with enough overlap to stay one
  // cohesive mass, plus a shallow medial carve just for a visible crease —
  // too much carve/separation and the lobes read as disconnected rocks
  // instead of one brain.
  const left = createLobeGeometry(5, 7, colorLeft, { ...cerebrumOptions, medialSide: 1, medialCarve: 0.12 });
  left.scale(0.64, 0.58, 0.9);
  left.rotateZ(0.06);
  left.rotateY(0.1);
  left.translate(-0.3, 0.05, 0.03);

  const right = createLobeGeometry(5, 13, colorRight, { ...cerebrumOptions, medialSide: -1, medialCarve: 0.12 });
  right.scale(0.64, 0.58, 0.9);
  right.rotateZ(-0.06);
  right.rotateY(-0.1);
  right.translate(0.3, 0.05, 0.03);

  // Temporal lobes — the landmark that turns a smooth egg silhouette into
  // something that actually reads as a brain: two smaller lobes hanging
  // down and forward from the lower sides of each hemisphere. Positioned
  // to overlap deep into the parent hemisphere's volume, not just touch
  // its edge, so they read as part of the same mass from every angle.
  const leftTemporal = createLobeGeometry(4, 31, colorLeft, temporalOptions);
  leftTemporal.scale(0.3, 0.22, 0.4);
  leftTemporal.rotateX(0.35);
  leftTemporal.rotateZ(0.1);
  leftTemporal.translate(-0.44, -0.2, 0.16);

  const rightTemporal = createLobeGeometry(4, 37, colorRight, temporalOptions);
  rightTemporal.scale(0.3, 0.22, 0.4);
  rightTemporal.rotateX(0.35);
  rightTemporal.rotateZ(-0.1);
  rightTemporal.translate(0.44, -0.2, 0.16);

  const cerebellum = createLobeGeometry(4, 21, colorCerebellum, cerebellumOptions);
  cerebellum.scale(0.42, 0.3, 0.32);
  cerebellum.translate(0, -0.36, -0.56);

  const brainstem = createBrainstemGeometry(colorStem);
  brainstem.rotateX(-0.2);
  brainstem.translate(0, -0.58, -0.4);

  const merged = mergeGeometries([left, right, leftTemporal, rightTemporal, cerebellum, brainstem], false);
  merged.scale(1.05, 1, 1.05);
  return merged;
}

// Plain, imperative Three.js — deliberately NOT @react-three/fiber. That
// library's react-reconciler crashes at module-evaluation time in this
// Next.js version (confirmed upstream bug, reproduced with a bare <Canvas>
// and zero drei — see components/hero/brain-scene.tsx for the full note).
// three.js itself has no dependency on React internals at all, so driving
// it imperatively from a ref + effect sidesteps that entirely.
export default function BrainCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    // Slightly elevated + looking down — a pure side-on view flattens the
    // twin-hemisphere split into a single silhouette; from above it reads
    // immediately as "two lobes with a groove between them".
    camera.position.set(0, 1.35, 4.1);
    camera.lookAt(0, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = createBrainGeometry();
    const material = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45,
      emissive: new THREE.Color("#191247"),
      emissiveIntensity: 0.45,
    });
    const brain = new THREE.Mesh(geometry, material);
    scene.add(brain);

    // Faint cyan wireframe aura just outside the surface — ties the organic
    // brain shape back to the site's "AI" visual language.
    const wireGeometry = new THREE.WireframeGeometry(geometry);
    const wireMaterial = new THREE.LineBasicMaterial({ color: "#3DD9FF", transparent: true, opacity: 0.035 });
    const wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    wire.scale.setScalar(1.02);
    brain.add(wire);

    // Soft rim/fresnel-style glow — a slightly larger, back-face-only,
    // additive shell around the same geometry. Cheap approximation of a
    // fresnel shader: only the silhouette edge (where we're looking through
    // the back face) shows through, giving a glowing-edge look without a
    // custom shader.
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: "#8B5CF6",
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const rimGlow = new THREE.Mesh(geometry, rimMaterial);
    rimGlow.scale.setScalar(1.045);
    brain.add(rimGlow);

    scene.add(new THREE.AmbientLight("#5a5aa0", 1.6));
    const key = new THREE.DirectionalLight("#a8bfff", 0.55);
    key.position.set(3, 3, 4);
    scene.add(key);
    const rim = new THREE.PointLight("#3DD9FF", 14, 20);
    rim.position.set(-3, -1, -3);
    scene.add(rim);
    const fill = new THREE.PointLight("#8B5CF6", 6, 20);
    fill.position.set(-2, 2, 2);
    scene.add(fill);

    const clock = new THREE.Clock();
    let raf = 0;

    const renderOnce = () => renderer.render(scene, camera);

    const animate = () => {
      const delta = clock.getDelta();
      brain.rotation.y += delta * 0.35;
      renderOnce();
      raf = requestAnimationFrame(animate);
    };

    const start = () => {
      if (prefersReducedMotion || raf) return;
      raf = requestAnimationFrame(animate);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    renderOnce();
    start();

    // Pause the render loop entirely (not just the rotation update) when
    // scrolled out of view or the tab is backgrounded — same intent as the
    // pause pattern already used elsewhere on this site for 3D scenes, just
    // driving requestAnimationFrame directly instead of a library API.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) start();
        else stop();
      },
      { rootMargin: "200px" }
    );
    observer.observe(container);

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else if (container.getBoundingClientRect().top < window.innerHeight + 200) start();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (prefersReducedMotion) renderOnce();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      geometry.dispose();
      material.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      rimMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
