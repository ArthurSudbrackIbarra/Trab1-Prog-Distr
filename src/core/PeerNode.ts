import fs from "fs";
import {
  KeepAliveMessage,
  Message,
  RegisterMessage,
  RegisterResponseMessage,
  ResourceMessage,
  ResourceRequestMessage,
  ResourceResponseMessage,
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
        await this.sendMessageToNode(message, superNode);
        resolve(superNode);
      } catch (error) {
        reject(error);
      }
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
    this.getSocket().on("message", async (message, remote) => {
      console.log(
        `Received message '${message}' from ${remote.address}:${remote.port}`
      );
      const decodedMessage = JSON.parse(message.toString()) as Message;
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
        case "resourceRequest":
          {
            const resourceRequestMessage =
              decodedMessage as ResourceRequestMessage;
            const resourceName = resourceRequestMessage.resourceNames[0];
            if (!resourceName) {
              console.log("No resource requested.");
              return;
            }
            const resourcePath = path.join(
              __dirname,
              "../resources",
              this.resourcesDirectory,
              resourceName
            );
            if (!fs.existsSync(resourcePath)) {
              console.log(
                `Resource '${resourceName}' ${RED}does not exist${RESET}.`
              );
              return;
            }
            const content = fs.readFileSync(resourcePath);
            const resourceMessage: ResourceMessage = {
              type: "resource",
              peerNodeName: this.getName(),
              content: content.toString(),
            };
            const peerNodeToSend = new PeerNode(
              resourceRequestMessage.peerNodeName,
              remote.address,
              resourceRequestMessage.peerNodePort
            );
            try {
              await this.sendMessageToNode(resourceMessage, peerNodeToSend);
            } catch (error) {
              console.error(
                `Error sending resource message to peer node ${peerNodeToSend.getName()}.`
              );
            }
          }
          break;
        case "resourceResponse": {
          const resourceResponseMessage =
            decodedMessage as ResourceResponseMessage;
          console.log(
            `Received resource response. Super node '${resourceResponseMessage.superNodeName}' pointed to peer node '${resourceResponseMessage.peerNodeName}'.`
          );
          const ownerPeerNode = new PeerNode(
            resourceResponseMessage.peerNodeName,
            resourceResponseMessage.peerNodeAddress,
            resourceResponseMessage.peerNodePort
          );
          const resourceRequestMessage: ResourceRequestMessage = {
            type: "resourceRequest",
            peerNodeName: this.getName(),
            peerNodePort: this.getPort(),
            resourceNames: [resourceResponseMessage.resourceName],
          };
          try {
            await this.sendMessageToNode(resourceRequestMessage, ownerPeerNode);
          } catch (error) {
            console.error(
              `Error sending resource request message to peer node '${ownerPeerNode.getName()}'.`
            );
          }
          break;
        }
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
        await this.sendMessageToNode(keepAliveMessage, this.superNode);
      } catch (error) {
        console.error(
          `Error sending keep alive message to super node ${this.superNode.getName()}.`
        );
      }
    }, 5000);
  }

  private resourceRequest: ResourceRequest | null = null;
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
      const resourceRequests = JSON.parse(fileContent) as ResourceRequest;
      if (!this.resourceRequest) {
        this.resourceRequest = resourceRequests;
        return;
      }
      if (
        JSON.stringify(this.resourceRequest) ===
        JSON.stringify(resourceRequests)
      ) {
        return;
      } else {
        console.log(`${YELLOW}Detected changes on file ${filePath}.${RESET}`);
        this.resourceRequest = resourceRequests;
        const resourceRequestMessage: ResourceRequestMessage = {
          type: "resourceRequest",
          peerNodeName: this.getName(),
          peerNodePort: this.getPort(),
          resourceNames: this.resourceRequest.resourceNames,
        };
        if (!this.superNode) {
          return;
        }
        this.sendMessageToNode(resourceRequestMessage, this.superNode);
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
