'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface VirtualTourProps {
  modelPath: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export default function VirtualTour({ 
  modelPath, 
  className = "", 
  onLoad, 
  onError 
}: VirtualTourProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera setup with narrower FOV for more natural perspective
    const camera = new THREE.PerspectiveCamera(
      65, // Slightly wider FOV for better room visibility
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Use orbital panning instead of screen-space
    controls.minDistance = 2; // Minimum distance from target
    controls.maxDistance = 8; // Maximum distance from target
    controls.minPolarAngle = Math.PI / 3; // 60 degrees from top
    controls.maxPolarAngle = Math.PI * 2/3; // 120 degrees from top
    controls.enableZoom = true;
    controls.zoomSpeed = 0.5; // Slower zoom for better control
    controls.rotateSpeed = 0.5; // Slower rotation for better control
    controlsRef.current = controls;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        // Analyze model dimensions
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Reset model position to origin
        gltf.scene.position.x -= center.x;
        gltf.scene.position.y -= center.y;
        gltf.scene.position.z -= center.z;

        // Scale model to reasonable size
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5 / maxDim;
        gltf.scene.scale.setScalar(scale);

        scene.add(gltf.scene);

        // Calculate scaled dimensions
        const scaledSize = size.multiplyScalar(scale);
        
        // Set the target to the center of the room
        const roomCenter = new THREE.Vector3(0, 0, 0);
        controls.target.copy(roomCenter);

        // Position camera at an angle that shows the room well
        const distance = Math.max(scaledSize.x, scaledSize.z) * 0.8;
        camera.position.set(
          distance, // X position
          scaledSize.y * 0.4, // Y position (40% up the room height)
          distance  // Z position
        );

        // Make sure camera is looking at room center
        camera.lookAt(roomCenter);
        controls.update();

        onLoad?.();
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        if (error instanceof Error) {
          onError?.(error);
        } else {
          onError?.(new Error(String(error)));
        }
      }
    );

    // Animation loop
    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    let resizeTimeout: NodeJS.Timeout;
    function handleResize() {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }, 100);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      scene.clear();
      if (container?.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelPath, onLoad, onError]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`} />
  );
} 