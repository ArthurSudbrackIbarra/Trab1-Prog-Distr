import Node from "./Node";
import System from "./System";

export default class PeerNode extends Node {
  constructor(name: string, address: string, port: number) {
    super(name, address, port);
  }

  public toString(): string {
    return `Peer Node - ${this.getName()} (${this.getAddress()}:${this.getPort()})`;
  }
  public start(): void {
    /*
      Method to start the peer node.
    */
  }

  /*
    Methods to be implemented.
  */
  public registerToSuperNode(): void {}
}
