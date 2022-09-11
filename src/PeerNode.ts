import Node from "./Node";

export default class PeerNode extends Node {
  /*
    Resources directory path.
  */
  private resourcesDirectory: string;

  constructor(
    name: string,
    address: string,
    port: number,
    resourcesDirectory: string
  ) {
    super(name, address, port);
    this.resourcesDirectory = resourcesDirectory;
  }

  public toString(): string {
    return `{\n\tPeer Node - ${this.getName()} (${this.getAddress()}:${this.getPort()})\n\tResources Directory: ${
      this.resourcesDirectory
    }\n}`;
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
