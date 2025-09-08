import { VrmDexie } from "./vrmDb";
import VrmDbModel from "./vrmDbModel";
import { db } from "./vrmDb";
import { Base64ToBlob } from "@/utils/blobDataUtils";

export class VrmDataProvider {
    private db: VrmDexie;

    constructor() {
        this.db = db;
        // Ensure database is properly initialized
        this.db.open().catch(err => {
            console.error('Failed to open VRM database:', err);
        });
    }

    componentWillUnmount() {
        this.db.close();
    }
    
    public addItem(hash: string, saveType: 'local' | 'web', vrmData: string = "", vrmUrl: string = "", thumbData: string = ""): void {
        this.db.vrms.put(new VrmDbModel(hash, saveType, vrmData, vrmUrl, thumbData));
    }

    public async getItems(): Promise<VrmDbModel[]> {
        try {
            // Ensure the database is open before accessing
            if (!this.db.isOpen()) {
                await this.db.open();
            }
            return await this.db.vrms.toArray();
        } catch (error) {
            console.error('Error getting VRM items:', error);
            // Return empty array as fallback
            return [];
        }
    }

    public updateItemThumb(hash: string, vrmThumbData: string): void {
        this.db.vrms.where("hash").equals(hash).modify({ thumbData: vrmThumbData });
    }

    public getItemAsBlob(hash: string): Promise<Blob | undefined> {
        return this.db.vrms.where("hash").equals(hash).first()
            .then(vrmDbModel => { console.log(`hash: ${hash}`); console.log(`vrmDbModel: ${vrmDbModel}`); return vrmDbModel ? Base64ToBlob(vrmDbModel?.vrmData) : undefined; });
    }

    public addItemUrl(hash: string, url: string) {
        this.db.vrms.where("hash").equals(hash).modify({ vrmUrl: url, saveType: 'web' });
    }
}

export const vrmDataProvider = new VrmDataProvider();