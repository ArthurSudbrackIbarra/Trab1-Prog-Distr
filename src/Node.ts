export default abstract class Node {
  private name: string;
  private address: string;
  private port: number;
  constructor(name: string, address: string, port: number) {
    this.name = name;
    this.address = address;
    this.port = port;
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
  public toString(): string {
    return `${this.name} (${this.address}:${this.port})`;
  }
}
