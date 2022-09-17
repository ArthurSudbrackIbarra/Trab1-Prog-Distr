import dgram from "dgram";
import { Message } from "../interfaces/messages";

export default abstract class Node {
  private name: string;
  private address: string;
  private port: number;
  private socket: dgram.Socket;

  constructor(name: string, address: string, port: number) {
    this.name = name;
    this.address = address;
    this.port = port;
    this.socket = dgram.createSocket("udp4");
  }

  public getName(): string {
    return this.name;
  }
  public getAddress(): string {
    return this.address;
  }
  public getPort(): number {
    return this.port;
  }
  public getSocket(): dgram.Socket {
    return this.socket;
  }
  public bindSocket(): void {
    this.socket.bind(this.port);
  }

  protected sendMessageToNode(
    message: Message,
    node: Node,
    printToScreen: boolean = true
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const jsonMessage = JSON.stringify(message);
      let address = node.getAddress();
      if (address === "localhost" || address === "127.0.0.1") {
        address = "host.docker.internal";
      }
      if (printToScreen) {
        console.log(
          `Sending message '${jsonMessage}' to ${address}:${node.getPort()}`
        );
      }
      this.socket.send(
        Buffer.from(jsonMessage),
        node.getPort(),
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

  public abstract toString(): string;
  public abstract start(): Promise<void>;
}
