export default class VrmDbModel {
    hash: string;
    saveType: 'local' | 'web';
    vrmData: string;
    vrmUrl: string;
    thumbData: string;

    constructor(
        hash: string, 
        saveType: 'local' | 'web', 
        vrmData: string = "", 
        vrmUrl: string = "", 
        thumbData: string = ""
    ) {
        this.hash = hash;
        this.saveType = saveType;
        this.vrmData = vrmData;
        this.vrmUrl = vrmUrl;
        this.thumbData = thumbData;
    }
}