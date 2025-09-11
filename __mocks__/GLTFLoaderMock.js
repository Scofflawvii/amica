export class GLTFLoader {
  register() {
    return this;
  }
  async loadAsync(_url) {
    // Mark param as intentionally unused in this mock
    void _url;
    return { userData: { vrmAnimations: [] } };
  }
}
