import superNodesConfiguration from "./configurations/super-nodes.json";
import peerNodesConfiguration from "./configurations/peer-nodes.json";

import System from "./System";
import SuperNode from "./SuperNode";
import PeerNode from "./PeerNode";

const system = new System();

for (const node of superNodesConfiguration.nodes) {
  system.addSuperNode(new SuperNode(node.name, node.address, node.port));
}
for (const node of peerNodesConfiguration.nodes) {
  system.addPeerNode(new PeerNode(node.name, node.address, node.port));
}

console.log(system);
