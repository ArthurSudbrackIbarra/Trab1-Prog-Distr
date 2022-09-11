import {
  KeepAliveMessage,
  Message,
  RegisterMessage,
} from "./messages/messages";
import Node from "./Node";
import SuperNode from "./SuperNode";
import System from "./System";
import { wait } from "./utils/time";

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

  /*
    Entrypoint function.
  */
  public async start(): Promise<void> {
    while (true) {
      try {
        const superNode = await this.registerToSuperNode();
        this.superNode = superNode;
        break;
      } catch (error) {
        console.log(error);
        await wait(5000);
      }
    }
    console.log(`Connected to super node ${this.superNode.getName()}.`);
    this.startListening();
    this.startKeepAliveMessages();
  }

  private registerToSuperNode(): Promise<SuperNode> {
    return new Promise(async (resolve, reject) => {
      const superNode = System.getRandomSuperNode();
      if (!superNode) {
        reject(`No super nodes available. Unnable to connect.`);
        return;
      }
      try {
        const message: RegisterMessage = {
          type: "register",
          name: this.getName(),
          port: this.getPort(),
          content: "???",
        };
        await this.sendMessageToSuperNode(message, superNode);
        resolve(superNode);
      } catch (error) {
        reject(error);
      }
    });
  }

  private sendMessageToSuperNode(
    message: Message,
    superNode: SuperNode | null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!superNode) {
        reject("The super node is null.");
        return;
      }
      let address = superNode.getAddress();
      if (
        (address === "localhost" || address === "127.0.0.1") &&
        this.getIsRunningInContainer()
      ) {
        address = "host.docker.internal";
      }
      const jsonMessage = JSON.stringify(message);
      console.log(
        `Sending message '${jsonMessage}' to ${address}:${superNode.getPort()}`
      );
      this.getSocket().send(
        Buffer.from(jsonMessage),
        superNode.getPort(),
        address,
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
    this.getSocket().on("message", (message, remote) => {
      console.log(
        `Received message '${message}' from ${remote.address}:${remote.port}`
      );
    });
  }

  private startKeepAliveMessages(): void {
    setInterval(async () => {
      if (!this.superNode) {
        return;
      }
      const keepAliveMessage: KeepAliveMessage = {
        type: "keepAlive",
        name: this.getName(),
      };
      try {
        await this.sendMessageToSuperNode(keepAliveMessage, this.superNode);
      } catch (error) {
        console.error(
          `Error sending keep alive message to super node ${this.superNode.getName()}.`
        );
      }
    }, 5000);
  }
}
