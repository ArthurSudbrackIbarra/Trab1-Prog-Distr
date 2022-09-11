import Node from "./Node";
import PeerNode from "./PeerNode";

export default class SuperNode extends Node {
  /*
    Order is used determine which supernode this supernode will connect to.
  */
  private order: number;
  /*
    The list of peer nodes connected to this super node.
  */
  private peerNodes: PeerNode[];

  constructor(name: string, address: string, port: number, order: number) {
    super(name, address, port);
    this.order = order;
    this.peerNodes = [];
  }

  public toString(): string {
    return `{\n\tSuper Node - ${this.getName()} (${this.getAddress()}:${this.getPort()})\n\tOrder: ${
      this.order
    }\n}`;
  }
  public async start(): Promise<void> {
    /*
      Method to start the super node.
    */
  }

  public getOrder(): number {
    return this.order;
  }
}
