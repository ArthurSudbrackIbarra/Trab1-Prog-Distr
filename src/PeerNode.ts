import Node from "./Node";

export default class PeerNode extends Node {
  constructor(name: string, address: string, port: number) {
    super(name, address, port);
  }
}
