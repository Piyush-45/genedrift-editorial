import type { PublicationHandoff, PublishedMediaAsset } from "./domain";
import type { CreatorMediaSource, ImmutableObjectStore } from "./ports";
export declare function publishMediaAssets(assets: PublicationHandoff["media"], source: CreatorMediaSource, objects: ImmutableObjectStore, maxBytes: number): Promise<PublishedMediaAsset[]>;
