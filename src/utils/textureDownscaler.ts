import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { logger } from "./logger";

interface Dimensions {
  width: number;
  height: number;
}

interface TextureSource {
  data: TexImageSource;
  width: number;
  height: number;
}

// Type for supported texture types in materials
type TextureType =
  | "map"
  | "normalMap"
  | "roughnessMap"
  | "metalnessMap"
  | "aoMap"
  | "emissiveMap"
  | "displacementMap"
  | "bumpMap"
  | "alphaMap"
  | "lightMap"
  | "clearcoatMap"
  | "clearcoatNormalMap"
  | "clearcoatRoughnessMap"
  | "sheenColorMap"
  | "sheenRoughnessMap"
  | "transmissionMap"
  | "thicknessMap"
  | "specularIntensityMap"
  | "specularColorMap"
  | "iridescenceMap"
  | "iridescenceThicknessMap";

// Create an off-screen canvas for image processing
function createOffscreenCanvas(
  width: number,
  height: number,
): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Scale down an image to new dimensions
function scaleImage(
  image: TexImageSource,
  newWidth: number,
  newHeight: number,
): Promise<ImageBitmap | HTMLCanvasElement> {
  const canvas = createOffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext("2d") as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;

  if (!ctx) {
    throw new Error("Failed to create 2D context");
  }

  // Use better quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw the image scaled down
  (ctx as CanvasRenderingContext2D).drawImage(
    image as CanvasImageSource,
    0,
    0,
    newWidth,
    newHeight,
  );

  // Return as ImageBitmap if supported, otherwise return canvas
  if (typeof createImageBitmap !== "undefined") {
    return createImageBitmap(canvas);
  }

  // Fallback: resolve with the canvas element
  return Promise.resolve(canvas as HTMLCanvasElement);
}

// Calculate new dimensions maintaining aspect ratio
function calculateNewDimensions(
  width: number,
  height: number,
  maxDimension: number,
): Dimensions {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const aspectRatio = width / height;
  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  }
  return {
    width: Math.round(maxDimension * aspectRatio),
    height: maxDimension,
  };
}

async function processTexture(
  texture: THREE.Texture,
  maxDimension: number,
): Promise<void> {
  if (!texture.image || !texture.image.width || !texture.image.height) {
    return;
  }

  const { width, height } = texture.image;
  const newDims = calculateNewDimensions(width, height, maxDimension);

  // Only scale if dimensions need to change and are actually smaller
  if (newDims.width < width || newDims.height < height) {
    try {
      const scaledImage = await scaleImage(
        texture.image,
        newDims.width,
        newDims.height,
      );

      texture.image = scaledImage as TexImageSource;
      (texture.source as unknown as TextureSource).data =
        scaledImage as TexImageSource;
      (texture.source as unknown as TextureSource).width = newDims.width;
      (texture.source as unknown as TextureSource).height = newDims.height;
      texture.needsUpdate = true;

      // Force mipmaps update
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
    } catch (error) {
      const { logger } = await import("./logger");
      logger
        .with({ subsystem: "gfx", module: "textureDownscaler" })
        .error("Failed to scale texture", error);
      throw error;
    }
  }
}

// Main function to downscale textures in a GLTF model
async function downscaleModelTextures(
  gltf: GLTF,
  maxDimension: number = 1024,
): Promise<GLTF> {
  const texturePromises: Promise<void>[] = [];
  const processedTextures = new Set<THREE.Texture>();

  gltf.scene.traverse((node: THREE.Object3D) => {
    if (!(node as THREE.Mesh).isMesh) return;

    if (node instanceof THREE.Mesh) {
      const mesh = node as THREE.Mesh;
      const materials: THREE.Material[] = Array.isArray(node.material)
        ? (node.material as THREE.Material[])
        : [node.material as THREE.Material];

      materials.forEach((material: THREE.Material) => {
        if (!material) return;

        const textureTypes: TextureType[] = [
          "map",
          "normalMap",
          "roughnessMap",
          "metalnessMap",
          "aoMap",
          "emissiveMap",
          "displacementMap",
          "bumpMap",
          "alphaMap",
          "lightMap",
          "clearcoatMap",
          "clearcoatNormalMap",
          "clearcoatRoughnessMap",
          "sheenColorMap",
          "sheenRoughnessMap",
          "transmissionMap",
          "thicknessMap",
          "specularIntensityMap",
          "specularColorMap",
          "iridescenceMap",
          "iridescenceThicknessMap",
        ];

        textureTypes.forEach((type: TextureType) => {
          const texture = (material as unknown as Record<string, unknown>)[
            type
          ] as THREE.Texture | undefined;
          if (texture && !processedTextures.has(texture)) {
            processedTextures.add(texture);
            texturePromises.push(processTexture(texture, maxDimension));
          }
        });
      });
    }
  });

  // Wait for all texture processing to complete
  await Promise.all(texturePromises);

  return gltf;
}

function logTextureInfo(gltf: GLTF): void {
  gltf.scene.traverse((node: THREE.Object3D) => {
    if (!(node as THREE.Mesh).isMesh) return;

    const mesh = node as THREE.Mesh;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    materials.forEach((material: THREE.Material, index: number) => {
      // Grouping is only visible in dev tools; keep in dev logs only
      console.group?.(`Material ${index} on mesh "${node.name}"`);
      Object.entries(material).forEach(([key, value]) => {
        if (value instanceof THREE.Texture && value.image) {
          logger
            .with({ subsystem: "gfx", module: "textureDownscaler" })
            .debug("texture size", {
              materialIndex: index,
              mesh: node.name,
              key,
              width: (value.image as any).width,
              height: (value.image as any).height,
            });
        }
      });
      console.groupEnd?.();
    });
  });
}

export {
  downscaleModelTextures,
  logTextureInfo,
  type Dimensions,
  type TextureType,
};
