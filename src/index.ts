import superNodesConfiguration from "./configurations/super-nodes.json";
import peerNodesConfiguration from "./configurations/peer-nodes.json";

import System from "./System";
import SuperNode from "./SuperNode";
import PeerNode from "./PeerNode";

/*
  System (Information about the whole system).
*/
const system = new System();
for (const node of superNodesConfiguration.nodes) {
  system.addSuperNode(new SuperNode(node.name, node.address, node.port));
}
for (const node of peerNodesConfiguration.nodes) {
  system.addPeerNode(new PeerNode(node.name, node.address, node.port));
}

/*
  Application node (The node for which the running application is responsible).
*/
const operationMode = process.argv[2];
const name = process.argv[3];

let address = "";
let port = 0;

const configurationToLook =
  operationMode.toLowerCase() === "supernode"
    ? superNodesConfiguration
    : peerNodesConfiguration;

for (const node of configurationToLook.nodes) {
  if (node.name === name) {
    address = node.address;
    port = node.port;
    break;
  }
}

if (!address || !port) {
  throw new Error("The node is not configured.");
}

console.log(`[${operationMode}] Starting ${name}...`);
console.log("Node configuration: ", { name, address, port });
console.log();
