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

  private startListening(): void {
    this.getSocket().on("message", (message, remote) => {
      console.log(
        `Received message '${message}' from ${remote.address}:${remote.port}`
      );
    });
  }
}
