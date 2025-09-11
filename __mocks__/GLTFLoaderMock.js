export class GLTFLoader {
  register() {
    return this;
  }
  async loadAsync(_url) {
    return { userData: { vrmAnimations: [] } };
  }
}
