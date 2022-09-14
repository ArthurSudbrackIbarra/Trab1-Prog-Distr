import { Resource } from "../resources/resources";

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
export interface ResourceRequestMessage extends Message {
  type: "resourceRequest";
  peerNodeName: string;
  peerNodePort: number;
  resourceNames: string[];
}
export interface ResourceResponseMessage extends Message {
  type: "resourceResponse";
  superNodeName: string;
  peerNodeName: string;
  peerNodeAddress: string;
  peerNodePort: number;
  resourceName: string;
}
export interface ResourceMessage extends Message {
  type: "resource";
  peerNodeName: string;
  content: string;
}
