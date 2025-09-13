import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OptimizedGLTFLoader } from "@/utils/gltfOptimizer";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

export class Room {
  public room?: THREE.Group;
  public splat?: InstanceType<typeof GaussianSplats3D.DropInViewer>;

  public async loadRoom(
    url: string,
    setLoadingProgress: (progress: string) => void,
  ): Promise<void> {
    const useOptimized = false; // flip to true to use optimized loader
    const loader = useOptimized
      ? new OptimizedGLTFLoader({
          skipTextures: true,
          maxTextureSize: 512,
          generateMipmaps: false,
          skipDraco: true,
          preserveIndices: false,
          skipAnimations: true,
          simplifyMaterials: true,
          disableNormalMaps: true,
          disposeSourceData: true,
          onMesh: (mesh) => {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          },
          onMaterial: (material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = 0;
            }
          },
          onTexture: (texture) => {
            texture.colorSpace = THREE.LinearSRGBColorSpace;
          },
        })
      : new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        async (gltf) => {
          setLoadingProgress("Room fully 100% loaded");
          /*
          {
            const analyzer = new GLTFAnalyzer();
            const stats = analyzer.analyzeModel(gltf);
            console.log('Model Statistics:', stats);
            const suggestions = analyzer.suggestOptimizations(stats);
            console.log('Optimization Suggestions:', suggestions);
          }
          {
          // Or for more control:
            const optimizer = new TransparencyOptimizer();
            const stats = optimizer.analyzeTransparency(gltf);
            console.log('Transparency analysis:', stats);
            // Check for issues
            const issues = optimizer.logTransparencyIssues();
            console.log('Transparency issues:', issues);

            // Apply optimizations
            optimizer.optimizeTransparency(gltf, {
              disableTransparency: true,     // Completely disable all transparency
              minAlphaThreshold: 0.9,        // Convert nearly opaque materials to fully opaque
              convertToAlphaTest: false,      // Convert transparency to alphaTest where possible
              alphaTestThreshold: 0.5        // Threshold for alphaTest conversion
            });
          }
          */

          // await downscaleModelTextures(gltf, 128);
          /*
          gltf.scene.traverse((obj: any) => {
            obj.frustumCulled = false;
          });
          */
          this.room = gltf.scene;

          resolve();
        },
        (xhr) => {
          setLoadingProgress(
            `${Math.floor((xhr.loaded / xhr.total) * 10000) / 100}% loaded`,
          );
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  public async loadSplat(url: string): Promise<void> {
    this.splat = new GaussianSplats3D.DropInViewer({
      progressiveLoad: true,
      // freeIntermediateSplatData: true,
      // https://github.com/mkkellogg/GaussianSplats3D?tab=readme-ov-file#cors-issues-and-sharedarraybuffer
      sharedMemoryForWorkers: false,
      gpuAcceleratedSort: false,
    });
    return this.splat.addSplatScene(url, {
      // splatAlphaRemovalThreshold: 5,
      splatAlphaRemovalThreshold: 20,
      // scale: [3, 3, 3],
      // position: [0, -1, 0],
    });
  }
}
