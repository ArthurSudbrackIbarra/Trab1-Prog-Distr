import PeerNode from "./PeerNode";
import SuperNode from "./SuperNode";

export default class System {
  private static superNodes: SuperNode[] = [];
  private static peerNodes: PeerNode[] = [];

  public static addSuperNode(superNode: SuperNode) {
    this.superNodes.push(superNode);
  }
  public static addPeerNode(peerNode: PeerNode) {
    this.peerNodes.push(peerNode);
  }

  public static getSuperNode(name: string): SuperNode | undefined {
    return this.superNodes.find((superNode) => superNode.getName() === name);
  }
  public static getRandomSuperNode(): SuperNode | undefined {
    return this.superNodes[Math.floor(Math.random() * this.superNodes.length)];
  }
  public static getPeerNode(name: string): PeerNode | undefined {
    return this.peerNodes.find((peerNode) => peerNode.getName() === name);
  }
  public static getNextSuperNode(order: number): SuperNode | undefined {
    const nextOrder = (order + 1) % this.superNodes.length;
    return this.superNodes.find(
      (superNode) => superNode.getOrder() === nextOrder
    );
  }
}
