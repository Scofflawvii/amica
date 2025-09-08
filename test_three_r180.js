// Test if MToonNodeMaterial works with Three.js r180 without patches
const THREE = require('three');

console.log(`Three.js version: ${THREE.REVISION}`);

try {
  // Test if we can import the nodes module
  const nodes = require('@pixiv/three-vrm/nodes');
  console.log('✅ VRM nodes module imported successfully');
  
  if (nodes.MToonNodeMaterial) {
    console.log('✅ MToonNodeMaterial is available');
  } else {
    console.log('❌ MToonNodeMaterial is not available');
  }
} catch (error) {
  console.error('❌ Error importing VRM nodes:', error.message);
  console.error('Stack:', error.stack);
}
