declare module '@mkkellogg/gaussian-splats-3d' {
  export class DropInViewer {
    constructor(options: any);
    addSplatScene(url: string, options: any): Promise<void>;
  }
  
  // Export other types if needed
  const content: any;
  export default content;
}
