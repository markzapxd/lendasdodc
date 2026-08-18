"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export function AsciiHero3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [modelScale, setModelScale] = useState(1.0);

  const modelGroupRef = useRef<THREE.Object3D | null>(null);
  const baseScaleRef = useRef<number>(1);

  // Update scale in real-time when slider changes
  useEffect(() => {
    if (modelGroupRef.current) {
      const s = baseScaleRef.current * modelScale;
      modelGroupRef.current.scale.set(s, s, s);
    }
  }, [modelScale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Canvas dimensions
    const width = container.clientWidth || 800;
    const height = Math.min(450, Math.max(300, Math.floor(width * 0.5)));

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 12);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // 4. Three.js AsciiEffect for crisp ASCII 3D (invert: false so ONLY the model is drawn in pink text)
    const effect = new AsciiEffect(renderer, " .:-=+*#%@", {
      invert: false,
      resolution: 0.22,
    });
    effect.setSize(width, height);

    // Custom ASCII styling
    const asciiDom = effect.domElement;
    asciiDom.style.color = "#ec195a";
    asciiDom.style.backgroundColor = "transparent";
    asciiDom.style.fontFamily = "monospace";
    asciiDom.style.fontWeight = "bold";
    asciiDom.style.textShadow = "0 0 10px rgba(236,25,90,0.7)";
    asciiDom.style.lineHeight = "0.9";
    asciiDom.style.letterSpacing = "1px";
    asciiDom.style.margin = "0 auto";
    asciiDom.style.userSelect = "none";

    container.appendChild(asciiDom);

    // 5. OrbitControls for intuitive mouse rotation
    const controls = new OrbitControls(camera, asciiDom);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;

    // 6. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pinkLight = new THREE.DirectionalLight(0xec195a, 4);
    pinkLight.position.set(10, 15, 10);
    scene.add(pinkLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 2);
    backLight.position.set(-10, -10, -10);
    scene.add(backLight);

    // 7. Load FBX Model
    const loader = new FBXLoader();

    loader.load(
      "/source/Discord%203D%20WOW.fbx",
      (fbx) => {
        // Center model and scale to fit camera view nicely
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const baseScale = 5.5 / maxDim;

        baseScaleRef.current = baseScale;
        const currentScale = baseScale * modelScale;

        fbx.scale.set(currentScale, currentScale, currentScale);
        fbx.position.sub(center.multiplyScalar(baseScale));

        // Apply vibrant neon pink material to meshes
        const pinkMaterial = new THREE.MeshStandardMaterial({
          color: 0xec195a,
          roughness: 0.3,
          metalness: 0.7,
          emissive: 0x3d0417,
        });

        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = pinkMaterial;
          }
        });

        modelGroupRef.current = fbx;
        scene.add(fbx);
      },
      undefined,
      (err) => {
        console.warn("FBX Load error, using 3D cube fallback:", err);
        const geometry = new THREE.BoxGeometry(3, 3, 3);
        const material = new THREE.MeshStandardMaterial({ color: 0xec195a });
        const cube = new THREE.Mesh(geometry, material);

        baseScaleRef.current = 1;
        cube.scale.set(modelScale, modelScale, modelScale);
        modelGroupRef.current = cube;
        scene.add(cube);
      },
    );

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      effect.render(scene, camera);
    };
    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 800;
      const newHeight = Math.min(450, Math.max(300, Math.floor(newWidth * 0.5)));

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
      effect.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(asciiDom)) {
        container.removeChild(asciiDom);
      }
    };
  }, []);

  return (
    <div className="mb-6 flex flex-col items-center justify-center gap-3">
      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className="relative flex min-h-[300px] w-full max-w-[800px] items-center justify-center overflow-hidden bg-transparent select-none"
      />

      {/* Ultra Minimalist Size Slider */}
      <div className="flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-300">
        <input
          aria-label="Ajustar tamanho do modelo 3D"
          type="range"
          min="0.3"
          max="2.5"
          step="0.05"
          value={modelScale}
          onChange={(e) => setModelScale(Number.parseFloat(e.target.value))}
          className="h-1 w-24 sm:w-36 accent-[#ec195a] bg-[#2b1742]/50 rounded-full cursor-pointer outline-none"
        />
      </div>
    </div>
  );
}
