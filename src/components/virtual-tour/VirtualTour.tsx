"use client";

import { useEffect, useRef, useState } from 'react';
// Remove static imports - we'll import dynamically inside useEffect
// to prevent server-side rendering issues

interface VirtualTourProps {
  modelPath: string;
  className?: string;
}

export default function VirtualTour({ modelPath, className = "" }: VirtualTourProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Disable ESLint for these specific lines to allow dynamic Three.js imports
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sceneRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Dynamically import Three.js and related modules
    const initThreeJS = async () => {
      try {
        // Import all Three.js dependencies dynamically
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
        
        // Store container reference for cleanup
        const container = containerRef.current;
        if (!container) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          90,  // Even wider FOV for super close-up view
          container.clientWidth / container.clientHeight,
          0.001,  // Super close near plane
          1000
        );
        camera.position.set(0.05, 0.05, 0.05);  // Start extremely close
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true  // Enable transparency
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8;  // Slightly darker exposure
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls setup
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 0.01;  // Allow getting extremely close
        controls.maxDistance = 5;    // Don't allow zooming out too far
        controls.maxPolarAngle = Math.PI / 1.2;  // Allow even more up/down viewing
        controlsRef.current = controls;

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);  // Brighter ambient
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);  // Brighter key light
        directionalLight.position.set(5, 8, 5);  // Higher position
        scene.add(directionalLight);

        // Add fill light from opposite side
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 3, -5);
        scene.add(fillLight);

        // Environment map
        new RGBELoader()
          .setPath('/envmaps/')
          .load('royal_esplanade_1k.hdr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.background = new THREE.Color(0xffffff);  // Use white background instead
          });

        // Clear any existing content
        while(scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }

        // Re-add lights after clearing
        scene.add(ambientLight);
        scene.add(directionalLight);
        scene.add(fillLight);

        // Load model
        const loader = new GLTFLoader();
        loader.load(
          modelPath,
          (gltf) => {
            // Center model
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            gltf.scene.position.x -= center.x;
            gltf.scene.position.y -= center.y;
            gltf.scene.position.z -= center.z;

            // Scale model to reasonable size
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 20 / maxDim;  // Make the model MUCH larger
            gltf.scene.scale.setScalar(scale);

            scene.add(gltf.scene);

            // Position camera to start inside
            const distance = maxDim * 0.02;  // Start SUPER close
            camera.position.set(distance, distance / 2, distance);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
            setIsLoading(false);
          },
          (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            console.log('Loading progress:', percent, '%');
          },
          (error) => {
            console.error('Error loading model:', error instanceof Error ? error.message : 'Unknown error');
            setIsLoading(false);
          }
        );

        // Animation loop
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        animate();

        // Handle resize
        function handleResize() {
          if (!container) return;
          const width = container.clientWidth;
          const height = container.clientHeight;

          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          renderer.dispose();
          scene.clear();
          if (container?.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (error) {
        console.error("Failed to initialize Three.js:", error);
        setIsLoading(false);
      }
    };

    initThreeJS();
  }, [modelPath]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="text-gray-700">Loading 3D Model...</div>
        </div>
      )}
    </div>
  );
} 