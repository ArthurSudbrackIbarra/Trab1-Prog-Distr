import {
  KeepAliveMessage,
  Message,
  RegisterMessage,
  RegisterResponseMessage,
} from "./messages/messages";
import Node from "./Node";
import PeerNode from "./PeerNode";

export default class SuperNode extends Node {
  /*
    Order is used determine which supernode this supernode will connect to.
  */
  private order: number;
  /*
    The map of peer nodes connected to this super node (name - object).
  */
  private peerNodes: Map<string, PeerNode>;

  constructor(name: string, address: string, port: number, order: number) {
    super(name, address, port);
    this.order = order;
    this.peerNodes = new Map();
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
  }

  private sendMessageToNode(message: Message, node: Node): Promise<void> {
    return new Promise((resolve, reject) => {
      const jsonMessage = JSON.stringify(message);
      console.log(
        `Sending message '${message}' to ${node.getAddress()}:${node.getPort()}`
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
            this.peerNodes.set(registerMessage.name, peerNode);
            console.log(
              `Added '${peerNode.getName()} - ${peerNode.getAddress()}:${peerNode.getPort()}' to the list of peer nodes.`
            );
          }
          break;
        case "keepAlive":
          {
            const keepAliveMessage = decodedMessage as KeepAliveMessage;
            console.log(
              `Received keep alive message from '${keepAliveMessage.name}'.`
            );
            // IMPLEMENT LOGIC.
          }
          break;
      }
    });
  }
}
