import Node from "./Node";
import System from "./System";

export default class SuperNode extends Node {
  /*
    Order is used determine which supernode this supernode will connect to.
  */
  private order: number;
  /*
    System object - Information about the whole system (super nodes, peer nodes...).
  */
  private system: System;

  constructor(
    name: string,
    address: string,
    port: number,
    order: number,
    system: System
  ) {
    super(name, address, port);
    this.order = order;
    this.system = system;
  }

  public toString(): string {
    return `{Super Node - ${this.getName()} (${this.getAddress()}:${this.getPort()})\n\tOrder: ${
      this.order
    }\n}`;
  }
  public start(): void {
    /*
      Method to start the super node.
    */
  }

  public getOrder(): number {
    return this.order;
  }
}
