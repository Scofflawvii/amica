import { VrmDexie } from "./vrmDb";
import VrmDbModel from "./vrmDbModel";
import { db } from "./vrmDb";
import { Base64ToBlob } from "@/utils/blobDataUtils";
import { logger } from "@/utils/logger";

const vlog = logger.with({ subsystem: "vrmStore", module: "vrmDataProvider" });

export class VrmDataProvider {
  private db: VrmDexie;

  constructor() {
    this.db = db;
  }

  componentWillUnmount() {
    this.db.close();
  }

  public async addItem(
    hash: string,
    saveType: "local" | "web",
    vrmData: string = "",
    vrmUrl: string = "",
    thumbData: string = "",
  ): Promise<void> {
    try {
      await this.ensureDbOpen();
      await this.db.vrms.put(
        new VrmDbModel(hash, saveType, vrmData, vrmUrl, thumbData),
      );
    } catch (error) {
      vlog.error("Error adding VRM item", error);
    }
  }

  private async ensureDbOpen(): Promise<void> {
    if (!this.db.isOpen()) {
      await this.db.open();
    }
  }

  public async getItems(): Promise<VrmDbModel[]> {
    try {
      await this.ensureDbOpen();
      const items = await this.db.vrms.toArray();
      return items || [];
    } catch (error) {
      vlog.error("Error getting VRM items", error);
      return [];
    }
  }

  public async updateItemThumb(
    hash: string,
    vrmThumbData: string,
  ): Promise<void> {
    try {
      await this.ensureDbOpen();
      await this.db.vrms
        .where("hash")
        .equals(hash)
        .modify({ thumbData: vrmThumbData });
    } catch (error) {
      vlog.error("Error updating VRM item thumb", error);
    }
  }

  public async getItemAsBlob(hash: string): Promise<Blob | undefined> {
    try {
      await this.ensureDbOpen();
      const vrmDbModel = await this.db.vrms.where("hash").equals(hash).first();
      vlog.debug("getItemAsBlob info", { hash, hasModel: !!vrmDbModel });
      return vrmDbModel ? Base64ToBlob(vrmDbModel.vrmData) : undefined;
    } catch (error) {
      vlog.error("Error getting VRM item as blob", error);
      return undefined;
    }
  }

  public async addItemUrl(hash: string, url: string): Promise<void> {
    try {
      await this.ensureDbOpen();
      await this.db.vrms
        .where("hash")
        .equals(hash)
        .modify({ vrmUrl: url, saveType: "web" });
    } catch (error) {
      vlog.error("Error adding VRM item URL", error);
    }
  }
}

export const vrmDataProvider = new VrmDataProvider();
