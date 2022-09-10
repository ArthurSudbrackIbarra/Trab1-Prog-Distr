import PeerNode from "./PeerNode";
import SuperNode from "./SuperNode";

export default class System {
  private superNodes: SuperNode[];
  private peerNodes: PeerNode[];

  constructor() {
    this.superNodes = [];
    this.peerNodes = [];
  }

  public addSuperNode(superNode: SuperNode) {
    this.superNodes.push(superNode);
  }
  public addPeerNode(p2pNode: PeerNode) {
    this.peerNodes.push(p2pNode);
  }
}
