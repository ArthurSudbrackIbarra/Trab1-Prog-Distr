import Node from "./Node";

export default class P2PNode extends Node {
  constructor(name: string, address: string, port: number) {
    super(name, address, port);
  }
}
