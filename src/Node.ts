import dgram from "dgram";

export default abstract class Node {
  private name: string;
  private address: string;
  private port: number;
  private isRunningInContainer: boolean;
  private socket: dgram.Socket;

  constructor(name: string, address: string, port: number) {
    this.name = name;
    this.address = address;
    this.port = port;
    this.isRunningInContainer = false;
    this.socket = dgram.createSocket("udp4");
    this.socket.bind(this.port);
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
  public getIsRunningInContainer(): boolean {
    return this.isRunningInContainer;
  }
  public setIsRunningInContainer(isRunningInContainer: boolean) {
    this.isRunningInContainer = isRunningInContainer;
  }
  public getSocket(): dgram.Socket {
    return this.socket;
  }

  public abstract toString(): string;
  public abstract start(): Promise<void>;
}
