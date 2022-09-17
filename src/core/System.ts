import SuperNode from "./SuperNode";

export default class System {
  private static superNodes: SuperNode[] = [];

  public static addSuperNode(superNode: SuperNode) {
    this.superNodes.push(superNode);
  }

  public static getSuperNodeByName(name: string): SuperNode | undefined {
    return this.superNodes.find((superNode) => superNode.getName() === name);
  }
  public static getRandomSuperNode(): SuperNode | undefined {
    return this.superNodes[Math.floor(Math.random() * this.superNodes.length)];
  }
  public static getAllSuperNodes(): SuperNode[] {
    return this.superNodes.map((superNode) => {
      return new SuperNode(
        superNode.getName(),
        superNode.getAddress(),
        superNode.getPort(),
        superNode.getOrder()
      );
    });
  }
  public static getNextSuperNode(order: number): SuperNode | undefined {
    const nextOrder = (order + 1) % this.superNodes.length;
    return this.superNodes.find(
      (superNode) => superNode.getOrder() === nextOrder
    );
  }
  public static getPartitionsNumber(): number {
    return this.superNodes.length;
  }
}
