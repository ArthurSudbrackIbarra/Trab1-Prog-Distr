import superNodesConfig from "./configurations/super-nodes.json";
import p2pNodesConfig from "./configurations/p2p-nodes.json";

import SuperNode from "./SuperNode";
import P2PNode from "./P2PNode";

const superNodes: SuperNode[] = [];
const p2pNodes: P2PNode[] = [];

for (const node of superNodesConfig.nodes) {
  superNodes.push(new SuperNode(node.name, node.address, node.port));
}
for (const node of p2pNodesConfig.nodes) {
  p2pNodes.push(new P2PNode(node.name, node.address, node.port));
}

console.log(superNodes);
console.log(p2pNodes);
