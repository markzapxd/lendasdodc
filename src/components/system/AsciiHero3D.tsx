"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { useTheme } from "@/components/theme/ThemeContext";

export function AsciiHero3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { config } = useTheme();

  const asciiDomRef = useRef<HTMLElement | null>(null);
  const themedLightRef = useRef<THREE.DirectionalLight | null>(null);
  const themedMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Update 3D ASCII colors dynamically when theme changes
  useEffect(() => {
    if (asciiDomRef.current) {
      asciiDomRef.current.style.color = config.primaryHex;
      asciiDomRef.current.style.textShadow = `0 0 10px ${config.primaryGlow}`;
    }
    if (themedLightRef.current) {
      themedLightRef.current.color.set(config.primaryHex);
    }
    if (themedMaterialRef.current) {
      themedMaterialRef.current.color.set(config.primaryHex);
    }
  }, [config]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Compact Canvas dimensions
    const width = container.clientWidth || 600;
    const height = Math.min(220, Math.max(160, Math.floor(width * 0.35)));

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // 4. Three.js AsciiEffect for crisp ASCII 3D
    const effect = new AsciiEffect(renderer, " .:-=+*#%@", {
      invert: false,
      resolution: 0.22,
    });
    effect.setSize(width, height);

    // Custom ASCII styling
    const asciiDom = effect.domElement;
    asciiDom.style.color = config.primaryHex;
    asciiDom.style.backgroundColor = "transparent";
    asciiDom.style.fontFamily = "monospace";
    asciiDom.style.fontWeight = "bold";
    asciiDom.style.textShadow = `0 0 10px ${config.primaryGlow}`;
    asciiDom.style.lineHeight = "0.9";
    asciiDom.style.letterSpacing = "1px";
    asciiDom.style.margin = "0 auto";
    asciiDom.style.userSelect = "none";

    asciiDomRef.current = asciiDom;
    container.appendChild(asciiDom);

    // 5. OrbitControls for intuitive mouse rotation
    const controls = new OrbitControls(camera, asciiDom);
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;

    // 6. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const themedLight = new THREE.DirectionalLight(config.primaryHex, 4);
    themedLight.position.set(10, 15, 10);
    themedLightRef.current = themedLight;
    scene.add(themedLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 2);
    backLight.position.set(-10, -10, -10);
    scene.add(backLight);

    // 7. Load FBX Model with texture fallback manager
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      if (url.endsWith(".tif") || url.endsWith(".png") || url.endsWith(".jpg")) {
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      }
      return url;
    });
    const loader = new FBXLoader(manager);

    loader.load(
      "/source/Discord%203D%20WOW.fbx",
      (fbx) => {
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const baseScale = 7.2 / maxDim;

        fbx.scale.set(baseScale, baseScale, baseScale);
        fbx.position.sub(center.multiplyScalar(baseScale));

        const themedMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(config.primaryHex),
          roughness: 0.3,
          metalness: 0.7,
        });
        themedMaterialRef.current = themedMaterial;

        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = themedMaterial;
          }
        });

        scene.add(fbx);
      },
      undefined,
      (err) => {
        console.warn("FBX Load error, using 3D cube fallback:", err);
        const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const themedMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(config.primaryHex),
        });
        themedMaterialRef.current = themedMaterial;
        const cube = new THREE.Mesh(geometry, themedMaterial);
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
      const newWidth = container.clientWidth || 600;
      const newHeight = Math.min(220, Math.max(160, Math.floor(newWidth * 0.35)));

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
    <div className="mb-3 flex items-center justify-center">
      <div
        ref={containerRef}
        className="relative flex h-[180px] sm:h-[220px] w-full max-w-[600px] items-center justify-center overflow-hidden bg-transparent select-none"
      />
    </div>
  );
}
