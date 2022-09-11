import Node from "./Node";
import SuperNode from "./SuperNode";
import System from "./System";

export default class PeerNode extends Node {
  /*
    Resources directory path.
  */
  private resourcesDirectory: string;
  /*
    The super node to which this peer node is connected.
  */
  private superNode: SuperNode | null;

  constructor(
    name: string,
    address: string,
    port: number,
    resourcesDirectory: string
  ) {
    super(name, address, port);
    this.resourcesDirectory = resourcesDirectory;
    this.superNode = null;
  }

  public toString(): string {
    return `{\n\tPeer Node - ${this.getName()} (${this.getAddress()}:${this.getPort()})\n\tResources Directory: ${
      this.resourcesDirectory
    }\n}`;
  }
  public async start(): Promise<void> {
    /*
      Method to start the peer node.
    */
    while (true) {
      try {
        this.registerToSuperNode();
        break;
      } catch (error) {
        console.log(error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  public registerToSuperNode(): Promise<void> {
    return new Promise((resolve, reject) => {
      const superNode = System.getRandomSuperNode();
      if (!superNode) {
        reject(
          `[${this.getName()}] No super nodes available. Unnable to connect.`
        );
        return;
      }
      this.getSocket().send(
        Buffer.from("Register message."),
        superNode.getPort(),
        superNode.getAddress(),
        (error) => {
          if (error) {
            reject(
              `[${this.getName()}] Error while sending message to super node.`
            );
          } else {
            this.superNode = superNode;
            resolve();
          }
        }
      );
    });
  }
}
