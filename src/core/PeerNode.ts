import fs from "fs";
import {
  KeepAliveMessage,
  Message,
  RegisterMessage,
  RegisterResponseMessage,
} from "../messages/messages";
import Node from "./Node";
import SuperNode from "./SuperNode";
import System from "./System";
import { wait } from "../utils/time";
import { RED, RESET, YELLOW } from "../utils/colors";
import path from "path";
import { Resource, ResourceRequest } from "../resources/resources";
import { createHash } from "crypto";

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
    resourcesDirectory: string = ""
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
    let superNode: SuperNode | null = null;
    while (true) {
      try {
        superNode = await this.sendRegistrationToSuperNode();
        break;
      } catch (error) {
        console.log(error);
        await wait(5000);
      }
    }
    console.log(`Trying to register to super node '${superNode.getName()}'.`);
    this.startListening();
    this.checkNoSuperNodeRoutine();
  }

  private sendRegistrationToSuperNode(): Promise<SuperNode> {
    return new Promise(async (resolve, reject) => {
      const superNode = System.getRandomSuperNode();
      if (!superNode) {
        reject(`No super nodes available. Unnable to connect.`);
        return;
      }
      try {
        const message: RegisterMessage = {
          type: "register",
          peerNodeName: this.getName(),
          peerNodePort: this.getPort(),
          resources: this.readResourcesDirectory(),
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
      if (address === "localhost" || address === "127.0.0.1") {
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

  private tryAgainInterval: NodeJS.Timer | null = null;
  private checkNoSuperNodeRoutine(): void {
    if (this.tryAgainInterval) {
      clearInterval(this.tryAgainInterval);
    }
    this.tryAgainInterval = setInterval(() => {
      if (this.superNode) {
        return;
      }
      console.log("Not connected to any super node, restarting...");
      this.start();
    }, 10000);
  }

  private startListening(): void {
    this.getSocket().on("message", (message, remote) => {
      console.log(
        `Received message '${message}' from ${remote.address}:${remote.port}`
      );
      const decodedMessage = JSON.parse(message.toString());
      switch (decodedMessage.type) {
        case "registerResponse":
          {
            const registerResponseMessage =
              decodedMessage as RegisterResponseMessage;
            if (registerResponseMessage.status === "success") {
              console.log(
                `Successfully registered to super node '${registerResponseMessage.superNodeName}'.`
              );
              this.superNode =
                System.getSuperNodeByName(
                  registerResponseMessage.superNodeName
                ) || null;
              this.startKeepAliveMessages();
              this.monitorRequestsFile();
            } else {
              console.error(
                `Error registering to super node ${registerResponseMessage.superNodeName}.`
              );
              /*
                Trying again.
              */
              this.start();
            }
          }
          break;
      }
    });
  }

  private startKeepAliveMessages(): void {
    setInterval(async () => {
      if (!this.superNode) {
        return;
      }
      const keepAliveMessage: KeepAliveMessage = {
        type: "keepAlive",
        peerNodeName: this.getName(),
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

  private requests: ResourceRequest | null = null;
  private monitorRequestsFile(): void {
    setInterval(() => {
      const filePath = path.join(
        __dirname,
        `../configurations/requests/${this.getName()}.json`
      );
      if (!fs.existsSync(filePath)) {
        console.log(
          `Requests file '${filePath}' ${RED}does not${RESET} exist.`
        );
        return;
      }
      const fileContent = fs.readFileSync(filePath).toString();
      const requests = JSON.parse(fileContent) as ResourceRequest;
      if (!this.requests) {
        this.requests = requests;
        return;
      }
      if (JSON.stringify(this.requests) === JSON.stringify(requests)) {
        return;
      } else {
        console.log(`${YELLOW}Detected changes on file ${filePath}.${RESET}`);
        this.requests = requests;
      }
    }, 5000);
  }

  private readResourcesDirectory(): Resource[] {
    const resourcesPath = path.join(
      __dirname,
      "../resources",
      this.resourcesDirectory
    );
    if (!fs.existsSync(resourcesPath)) {
      throw new Error(
        `Resources directory '${resourcesPath}' ${RED}does not exist${RESET}.`
      );
    }
    const resources: Resource[] = [];
    const files = fs.readdirSync(resourcesPath);
    for (const fileName of files) {
      const filePath = path.join(resourcesPath, fileName);
      const fileContent = fs.readFileSync(filePath);
      const resource: Resource = {
        fileName: fileName,
        contentHash: createHash("sha256").update(fileContent).digest("hex"),
      };
      resources.push(resource);
    }
    return resources;
  }
}
