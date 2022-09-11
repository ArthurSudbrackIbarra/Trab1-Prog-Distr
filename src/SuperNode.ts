import {
  KeepAliveMessage,
  Message,
  RegisterMessage,
  RegisterResponseMessage,
} from "./messages/messages";
import Node from "./Node";
import PeerNode from "./PeerNode";
import { RED, RESET } from "./utils/colors";

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
      console.log(
        `Sending message '${jsonMessage}' to ${node.getAddress()}:${node.getPort()}`
      );
      this.getSocket().send(
        Buffer.from(jsonMessage),
        node.getPort(),
        node.getAddress(),
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
              registerMessage.name,
              remote.address,
              registerMessage.port,
              registerMessage.content
            );
            const registerResponseMessage: RegisterResponseMessage = {
              type: "registerResponse",
              name: this.getName(),
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
            this.peerNodesData.set(registerMessage.name, {
              peerNode: peerNode,
              lastKeepAliveTime: Date.now(),
            });
            console.log(
              `Added '${peerNode.getName()} - ${peerNode.getAddress()}:${peerNode.getPort()}' to the list of peer nodes.`
            );
          }
          break;
        case "keepAlive":
          {
            const keepAliveMessage = decodedMessage as KeepAliveMessage;
            const peerNodeData = this.peerNodesData.get(keepAliveMessage.name);
            if (peerNodeData) {
              peerNodeData.lastKeepAliveTime = Date.now();
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
}
