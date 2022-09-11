export default abstract class Node {
  private name: string;
  private address: string;
  private port: number;
  private isRunningInContainer: boolean;

  constructor(name: string, address: string, port: number) {
    this.name = name;
    this.address = address;
    this.port = port;
    this.isRunningInContainer = false;
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

  public abstract toString(): string;
  public abstract start(): void;
}
