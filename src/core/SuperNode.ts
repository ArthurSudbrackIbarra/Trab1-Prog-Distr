import crypto from "crypto";
import {
  KeepAliveMessage,
  Message,
  RegisterMessage,
  RegisterResponseMessage,
  ResourceRequestMessage,
  ResourceResponseMessage,
  ResourceSearchMessage,
  ResourceTransferMessage,
} from "../messages/messages";
import Node from "./Node";
import PeerNode from "./PeerNode";
import { GREEN, RED, RESET, YELLOW } from "../utils/colors";
import System from "./System";
import { Resource } from "../resources/resources";

interface PeerNodeData {
  peerNode: PeerNode;
  lastKeepAliveTime: number;
}

export default class SuperNode extends Node {
  /*
    Order is used determine which supernode this supernode will connect to.
  */
  private order: number;
  /*
    The map of peer nodes connected to this super node. Key = peer node name, value = peer node object.
  */
  private peerNodesData: Map<string, PeerNodeData>;

  /*
    Resources mapping (DHT). Key = resource name, value = peer node that has the resource.
  */
  private dht = new Map<string, PeerNode>();

  /*
    List of pending resource requests. Key = request ID, value = peer node that requested the resource.
  */
  private pendingResourceRequestsData: Map<string, PeerNode>;

  constructor(name: string, address: string, port: number, order: number) {
    super(name, address, port);
    this.order = order;
    this.peerNodesData = new Map();
    this.pendingResourceRequestsData = new Map();
  }

  public toString(): string {
    return `{\n\tSuper Node - ${this.getName()} (${this.getAddress()}:${this.getPort()})\n\tOrder: ${
      this.order
    }\n}`;
  }
  public getOrder(): number {
    return this.order;
  }

  public async start(): Promise<void> {
    this.startListening();
    this.checkDeadPeerNodesRoutine();
  }

  private startListening(): void {
    this.getSocket().on("message", async (message, remote) => {
      console.log(
        `Received message '${message}' from ${remote.address}:${remote.port}`
      );
      const decodedMessage = JSON.parse(message.toString()) as Message;
      switch (decodedMessage.type) {
        case "register":
          {
            const registerMessage = decodedMessage as RegisterMessage;
            const peerNode = new PeerNode(
              registerMessage.peerNodeName,
              remote.address,
              registerMessage.peerNodePort
            );
            const registerResponseMessage: RegisterResponseMessage = {
              type: "registerResponse",
              superNodeName: this.getName(),
              status: "success",
            };
            try {
              await this.sendMessageToNode(registerResponseMessage, peerNode);
            } catch (error) {
              console.error(
                "Error sending response message to peer node: ",
                error
              );
              return;
            }
            this.peerNodesData.set(registerMessage.peerNodeName, {
              peerNode: peerNode,
              lastKeepAliveTime: Date.now(),
            });
            console.log(
              `Added '${peerNode.getName()} - ${peerNode.getAddress()}:${peerNode.getPort()}' to the list of peer nodes.`
            );
            this.handleResources(registerMessage.resources, peerNode);
          }
          break;
        case "keepAlive":
          {
            const keepAliveMessage = decodedMessage as KeepAliveMessage;
            const peerNodeData = this.peerNodesData.get(
              keepAliveMessage.peerNodeName
            );
            if (peerNodeData) {
              peerNodeData.lastKeepAliveTime = Date.now();
            }
          }
          break;
        case "resourceTransfer":
          {
            const resourceTransferMessage =
              decodedMessage as ResourceTransferMessage;
            const peerNode = new PeerNode(
              resourceTransferMessage.peerNodeName,
              resourceTransferMessage.peerNodeAddress,
              resourceTransferMessage.peerNodePort
            );
            this.handleResources([resourceTransferMessage.resource], peerNode);
          }
          break;
        case "resourceRequest":
          {
            const resourceRequestMessage =
              decodedMessage as ResourceRequestMessage;
            const resourceNames = resourceRequestMessage.resourceNames;
            const peerNodeToSend = new PeerNode(
              resourceRequestMessage.peerNodeName,
              remote.address,
              resourceRequestMessage.peerNodePort
            );
            for (const resourceName of resourceNames) {
              const peerNode = this.dht.get(resourceName);
              if (peerNode) {
                console.log(
                  `Requested resource '${resourceName}' ${GREEN}belongs to me${RESET}.`
                );
                const resourceResponseMessage: ResourceResponseMessage = {
                  type: "resourceResponse",
                  superNodeName: this.getName(),
                  peerNodeName: peerNode.getName(),
                  peerNodeAddress: peerNode.getAddress(),
                  peerNodePort: peerNode.getPort(),
                  resourceName: resourceName,
                };
                try {
                  await this.sendMessageToNode(
                    resourceResponseMessage,
                    peerNodeToSend
                  );
                } catch (error) {
                  console.error(
                    "Error sending resource response message to peer node: ",
                    error
                  );
                  return;
                }
              } else {
                const nextSuperNode = System.getNextSuperNode(this.order);
                if (!nextSuperNode) {
                  return;
                }
                console.log(
                  `Requested resource '${resourceName}' ${YELLOW}does not belong to me${RESET}. Asking to '${nextSuperNode.getName()}'.`
                );
                const uniqueID = crypto.randomUUID();
                this.pendingResourceRequestsData.set(uniqueID, peerNodeToSend);
                const resourceSearchMessage: ResourceSearchMessage = {
                  type: "resourceSearch",
                  id: uniqueID,
                  superNodeName: this.getName(),
                  resourceName: resourceName,
                };
                try {
                  await this.sendMessageToNode(
                    resourceSearchMessage,
                    nextSuperNode
                  );
                } catch (error) {
                  console.error(
                    "Error sending resource search message to next super node: ",
                    error
                  );
                  return;
                }
              }
            }
          }
          break;
        case "resourceResponse":
          {
            const resourceResponseMessage =
              decodedMessage as ResourceResponseMessage;
            if (!resourceResponseMessage.id) {
              return;
            }
            const peerNode = this.pendingResourceRequestsData.get(
              resourceResponseMessage.id
            );
            if (peerNode) {
              console.log(
                `Resources found for my request with id '${
                  resourceResponseMessage.id
                }', replying to my peer node '${peerNode.getName()}'.`
              );
              this.pendingResourceRequestsData.delete(
                resourceResponseMessage.id
              );
              const newResourceResponseMessage: ResourceResponseMessage = {
                type: "resourceResponse",
                superNodeName: this.getName(),
                peerNodeName: resourceResponseMessage.peerNodeName,
                peerNodeAddress: resourceResponseMessage.peerNodeAddress,
                peerNodePort: resourceResponseMessage.peerNodePort,
                resourceName: resourceResponseMessage.resourceName,
              };
              try {
                await this.sendMessageToNode(
                  newResourceResponseMessage,
                  peerNode
                );
              } catch (error) {
                console.error(
                  "Error sending resource response message to peer node: ",
                  error
                );
                return;
              }
            } else {
              const nextSuperNode = System.getNextSuperNode(this.order);
              if (!nextSuperNode) {
                return;
              }
              console.log(
                `Resources found for the request with id '${
                  resourceResponseMessage.id
                }', forwarding to super node '${nextSuperNode.getName()}'.`
              );
              const newResourceResponseMessage: ResourceResponseMessage = {
                type: "resourceResponse",
                superNodeName: this.getName(),
                id: resourceResponseMessage.id,
                peerNodeName: resourceResponseMessage.peerNodeName,
                peerNodeAddress: resourceResponseMessage.peerNodeAddress,
                peerNodePort: resourceResponseMessage.peerNodePort,
                resourceName: resourceResponseMessage.resourceName,
              };
              try {
                await this.sendMessageToNode(
                  newResourceResponseMessage,
                  nextSuperNode
                );
              } catch (error) {
                console.error(
                  "Error sending resource response message to next super node: ",
                  error
                );
                return;
              }
            }
          }
          break;
        case "resourceSearch":
          {
            const resourceSearchMessage =
              decodedMessage as ResourceSearchMessage;
            if (
              this.pendingResourceRequestsData.get(resourceSearchMessage.id)
            ) {
              console.log(
                `My resource request with id '${resourceSearchMessage.id}' ${YELLOW}completed a cycle in the ring and was not found${RESET}. Telling my peer node...`
              );
              const resourceResponseMessage: ResourceResponseMessage = {
                type: "resourceResponse",
                superNodeName: this.getName(),
                peerNodeName: null,
                peerNodeAddress: null,
                peerNodePort: null,
                resourceName: resourceSearchMessage.resourceName,
              };
              const peerNodeToSend = this.pendingResourceRequestsData.get(
                resourceSearchMessage.id
              );
              this.pendingResourceRequestsData.delete(resourceSearchMessage.id);
              if (!peerNodeToSend) {
                return;
              }
              try {
                await this.sendMessageToNode(
                  resourceResponseMessage,
                  peerNodeToSend
                );
              } catch (error) {
                console.error(
                  "Error sending resource response message to peer node: ",
                  error
                );
                return;
              }
            } else {
              const nextSuperNode = System.getNextSuperNode(this.order);
              if (!nextSuperNode) {
                return;
              }
              const peerNode = this.dht.get(resourceSearchMessage.resourceName);
              if (peerNode) {
                console.log(
                  `Requested resource '${resourceSearchMessage.resourceName}' ${GREEN}belongs to me${RESET}.`
                );
                const resourceResponseMessage: ResourceResponseMessage = {
                  type: "resourceResponse",
                  id: resourceSearchMessage.id,
                  superNodeName: this.getName(),
                  peerNodeName: peerNode.getName(),
                  peerNodeAddress: peerNode.getAddress(),
                  peerNodePort: peerNode.getPort(),
                  resourceName: resourceSearchMessage.resourceName,
                };
                try {
                  await this.sendMessageToNode(
                    resourceResponseMessage,
                    nextSuperNode
                  );
                } catch (error) {
                  console.error(
                    "Error sending resource response message to next super node: ",
                    error
                  );
                  return;
                }
              } else {
                console.log(
                  `Requested resource '${
                    resourceSearchMessage.resourceName
                  }' ${YELLOW}does not belong to me${RESET}. Asking to '${nextSuperNode.getName()}'.`
                );
                const newResourceSearchMessage: ResourceSearchMessage = {
                  type: "resourceSearch",
                  id: resourceSearchMessage.id,
                  superNodeName: this.getName(),
                  resourceName: resourceSearchMessage.resourceName,
                };
                try {
                  await this.sendMessageToNode(
                    newResourceSearchMessage,
                    nextSuperNode
                  );
                } catch (error) {
                  console.error(
                    "Error sending resource search message to next super node: ",
                    error
                  );
                  return;
                }
              }
            }
          }
          break;
      }
    });
  }

  private checkDeadPeerNodesRoutine(): void {
    setInterval(() => {
      const currentTime = Date.now();
      this.peerNodesData.forEach((peerNodeData, nodeName) => {
        if (currentTime - peerNodeData.lastKeepAliveTime > 10000) {
          console.log(
            `Peer node '${nodeName}' has ${RED}disconnected${RESET} and will be removed.`
          );
          this.peerNodesData.delete(nodeName);
        }
      });
    }, 5000);
  }

  private async handleResources(
    resources: Resource[],
    peerNode: PeerNode
  ): Promise<void> {
    for (const resource of resources) {
      const contentHashAsNumber = parseInt(resource.contentHash, 16);
      const partitionsNumber = System.getPartitionsNumber();
      const partition = contentHashAsNumber % partitionsNumber;
      if (partition === this.order) {
        console.log(
          `Resource '${resource.fileName}' ${GREEN}belongs to my hash range${RESET}.`
        );
        this.dht.set(resource.fileName, peerNode);
      } else {
        console.log(
          `Resource '${resource.fileName}' ${YELLOW}does not belong to my hash range${RESET}.`
        );
        const resourceTransferMessage: ResourceTransferMessage = {
          type: "resourceTransfer",
          superNodeName: this.getName(),
          peerNodeName: peerNode.getName(),
          peerNodeAddress: peerNode.getAddress(),
          peerNodePort: peerNode.getPort(),
          resource: resource,
        };
        const nextSuperNode = System.getNextSuperNode(this.order);
        if (!nextSuperNode) {
          console.error("Could not find next super node in the ring.");
          return;
        }
        try {
          await this.sendMessageToNode(resourceTransferMessage, nextSuperNode);
        } catch (error) {
          console.error("Error sending resource transfer message: ", error);
          return;
        }
      }
    }
  }
}
