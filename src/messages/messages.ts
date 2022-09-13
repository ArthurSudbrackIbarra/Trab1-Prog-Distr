import { Resource, ResourceRequest } from "../resources/resources";

export interface Message {
  type: string;
}

export interface RegisterMessage extends Message {
  type: "register";
  peerNodeName: string;
  peerNodePort: number;
  resources: Resource[];
}
export interface RegisterResponseMessage extends Message {
  type: "registerResponse";
  superNodeName: string;
  status: "success" | "failure";
}

export interface KeepAliveMessage extends Message {
  type: "keepAlive";
  peerNodeName: string;
}

export interface ResourceTransferMessage extends Message {
  type: "resourceTransfer";
  superNodeName: string;
  peerNodeName: string;
  peerNodeAddress: string;
  peerNodePort: number;
  resource: Resource;
}
export interface ResourceRequestMessage extends Message, ResourceRequest {
  type: "resourceRequest";
  peerNodeName: string;
  peerNodePort: number;
}
export interface ResourceResponseMessage extends Message {
  type: "resourceResponse";
  peerNodeName: string;
  peerNodeAddress: string;
  peerNodePort: number;
}
