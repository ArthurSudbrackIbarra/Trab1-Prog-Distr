import {
  KeepAliveMessage,
  Message,
  RegisterMessage,
  RegisterResponseMessage,
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
    The map of peer nodes connected to this super node (name - object).
  */
  private peerNodesData: Map<string, PeerNodeData>;

  constructor(name: string, address: string, port: number, order: number) {
    super(name, address, port);
    this.order = order;
    this.peerNodesData = new Map();
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

  private sendMessageToNode(message: Message, node: Node): Promise<void> {
    return new Promise((resolve, reject) => {
      const jsonMessage = JSON.stringify(message);
      let address = node.getAddress();
      if (address === "localhost" || address === "127.0.0.1") {
        address = "host.docker.internal";
      }
      console.log(
        `Sending message '${jsonMessage}' to ${address}:${node.getPort()}`
      );
      this.getSocket().send(
        Buffer.from(jsonMessage),
        node.getPort(),
        address,
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
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
            this.handleResources(
              registerMessage.resources,
              registerMessage.peerNodeName,
              remote.address,
              registerMessage.peerNodePort
            );
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
            this.handleResources(
              [resourceTransferMessage.resource],
              resourceTransferMessage.peerNodeName,
              resourceTransferMessage.peerNodeAddress,
              resourceTransferMessage.peerNodePort
            );
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
    peerNodeName: string,
    peerNodeAddress: string,
    peerNodePort: number
  ): Promise<void> {
    for (const resource of resources) {
      const contentHashAsNumber = parseInt(resource.contentHash, 16);
      const partitionsNumber = System.getPartitionsNumber();
      const partition = contentHashAsNumber % partitionsNumber;
      if (partition === this.order) {
        console.log(
          `Resource '${resource.fileName}' will be ${GREEN}managed by me${RESET}.`
        );
        // Continue...
      } else {
        console.log(
          `Resource '${resource.fileName}' will ${YELLOW}NOT be managed by me${RESET}.`
        );
        const resourceTransferMessage: ResourceTransferMessage = {
          type: "resourceTransfer",
          superNodeName: this.getName(),
          peerNodeName: peerNodeName,
          peerNodeAddress: peerNodeAddress,
          peerNodePort: peerNodePort,
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
