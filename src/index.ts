import superNodesConfiguration from "./configurations/nodes/super-nodes.json";
import peerNodesConfiguration from "./configurations/nodes/peer-nodes.json";

import Node from "./core/Node";
import System from "./core/System";
import SuperNode from "./core/SuperNode";
import PeerNode from "./core/PeerNode";
import { BLUE, RED, RESET } from "./utils/colors";

/*
  System (Information about the whole system).
*/
for (let i = 0; i < superNodesConfiguration.nodes.length; i++) {
  const node = superNodesConfiguration.nodes[i];
  const order = i;
  System.addSuperNode(new SuperNode(node.name, node.address, node.port, order));
}

/*
  Application node (The node for which the running application is responsible).
*/
const operationMode = process.argv[2];
const nodeName = process.argv[3];
if (!operationMode || !nodeName) {
  console.log(
    "Usage: npx tsc && node build/index.js <operation-mode> <node-name> ..."
  );
  process.exit(1);
}

let applicationNode: Node | undefined = undefined;
if (operationMode.toLowerCase() === "super-node") {
  /*
    Super node.
  */
  applicationNode = System.getSuperNodeByName(nodeName);
} else if (operationMode.toLowerCase() === "peer-node") {
  /*
    Peer node.
  */
  const nodeInfo = peerNodesConfiguration.nodes.find(
    (node) => node.name === nodeName
  );
  if (!nodeInfo) {
    console.log(`[${RED}Error${RESET}] Invalid peer node name.`);
    process.exit(1);
  }
  applicationNode = new PeerNode(
    nodeName,
    nodeInfo.address,
    nodeInfo.port,
    nodeInfo.resources_directory
  );
} else {
  /*
    Invalid operation mode.
  */
  console.log(`[${RED}Error${RESET}] Invalid operation mode.`);
  process.exit(1);
}

if (!applicationNode) {
  console.error(
    `[${RED}Error${RESET}] Super node '${nodeName}' is not defined in src/configurations/super-nodes.json.`
  );
  process.exit(1);
}

console.log(
  `[${BLUE}STARTED${RESET}] - [${applicationNode.getName()}] [${applicationNode.getAddress()}:${applicationNode.getPort()}]`
);
console.log(applicationNode.toString(), "\n");

/*
  Starting the application node.
*/
applicationNode.bindSocket();
applicationNode.start();
