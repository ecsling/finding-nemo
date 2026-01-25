"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import MouseTrail from "@/components/MouseTrail";

export default function ContainerViewerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 30, 50);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 150;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemisphereLight);

    // Load cargo ship model
    const loader = new GLTFLoader();
    loader.load(
      "/cargo_ship_02.glb",
      (gltf) => {
        const model = gltf.scene;
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 30 / maxDim;
        model.scale.setScalar(scale);
        
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale;
        model.position.z = -center.z * scale;
        
        // Enable shadows
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        setModelLoaded(true);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
      }
    );

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  return (
    <div className="relative h-screen w-screen bg-background text-foreground flex">
      <MouseTrail />
      
      {/* Header with home button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="group inline-flex items-center justify-center rounded-full bg-transparent p-3 text-foreground hover:bg-foreground/10 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Home className="h-5 w-5" />
        </Link>
      </div>

      {/* Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
          Container Viewer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect vessel cargo and details
        </p>
      </div>

      {/* Left Panel - Container Details */}
      <div className="w-1/3 h-full border-r border-border bg-card/30 backdrop-blur-sm p-6 overflow-y-auto">
        <div className="flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 border-b border-border pb-3">
            Container Details
          </h2>
          
          {!selectedContainer ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4 opacity-50"
                >
                  <rect x="3" y="8" width="18" height="12" rx="1" />
                  <path d="M10 8V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
                  <path d="M3 13h18" />
                </svg>
                <p className="text-lg">Click on a container to get started</p>
                <p className="text-sm mt-2">
                  Select a container from the 3D model to view its details
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-medium mb-2">Container Information</h3>
                <p className="text-sm text-muted-foreground">
                  Details will appear here when a container is selected.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - 3D Model */}
      <div className="flex-1 h-full relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {!modelLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
              <p className="text-muted-foreground">Loading cargo ship model...</p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-6 right-6 bg-card/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Controls</p>
          <div className="text-xs space-y-1">
            <div><span className="font-medium">Left Click + Drag:</span> Rotate</div>
            <div><span className="font-medium">Right Click + Drag:</span> Pan</div>
            <div><span className="font-medium">Scroll:</span> Zoom</div>
          </div>
        </div>
      </div>
    </div>
  );
}
