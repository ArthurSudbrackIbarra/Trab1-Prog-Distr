export interface Resource {
  fileName: string;
  contentHash: string;
}
export interface ResourceRequest {
  requests: Resource[];
}
