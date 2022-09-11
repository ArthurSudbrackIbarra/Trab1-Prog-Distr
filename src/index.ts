import superNodesConfiguration from "./configurations/super-nodes.json";
import peerNodesConfiguration from "./configurations/peer-nodes.json";

import System from "./System";
import SuperNode from "./SuperNode";
import PeerNode from "./PeerNode";

/*
  System (Information about the whole system).
*/
const system = new System();
for (let i = 0; i < superNodesConfiguration.nodes.length; i++) {
  const node = superNodesConfiguration.nodes[i];
  const order = i + 1;
  system.addSuperNode(
    new SuperNode(node.name, node.address, node.port, order, system)
  );
}
for (const node of peerNodesConfiguration.nodes) {
  system.addPeerNode(new PeerNode(node.name, node.address, node.port));
}

/*
  Application node (The node for which the running application is responsible).
*/
const operationMode = process.argv[2];
const nodeName = process.argv[3];
if (!operationMode || !nodeName) {
  console.log(
    "Usage: npx tsc && node build/index.js <operation-mode> <node-name>"
  );
  process.exit(1);
}

const applicationNode =
  operationMode.toLowerCase() === "super-node"
    ? system.getSuperNode(nodeName)
    : system.getPeerNode(nodeName);

if (!applicationNode) {
  console.error(`[Error] Invalid super node name: ${nodeName}.`);
  process.exit(1);
}

if (process.env.IS_CONTAINER) {
  applicationNode.setIsRunningInContainer(true);
}

const GREEN = "\u001b[32m";
const RESET = "\u001b[0m";

console.log(
  `[${GREEN}${operationMode.toUpperCase()}${RESET}] [${GREEN}${
    applicationNode.getIsRunningInContainer() ? "CONTAINER" : "HOST MACHINE"
  }${RESET}]`
);
console.log(applicationNode.toString(), "\n");

/*
  Starting the application node.
*/
applicationNode.start();
