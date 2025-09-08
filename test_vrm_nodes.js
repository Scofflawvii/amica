// Test script to verify VRM nodes work with simplified patch
try {
  const { MToonNodeMaterial } = require("@pixiv/three-vrm/nodes");
  console.log("✅ MToonNodeMaterial imported successfully");
  console.log("✅ Simplified patch works - no version checking needed");
} catch (error) {
  console.error("❌ Error importing VRM nodes:", error.message);
  console.error("❌ Simplified patch may have issues");
}
