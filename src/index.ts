import superNodesConfiguration from "./configurations/super-nodes.json";

import Node from "./Node";
import System from "./System";
import SuperNode from "./SuperNode";
import PeerNode from "./PeerNode";
import { GREEN, RED, RESET } from "./utils/colors";

/*
  System (Information about the whole system).
*/
for (let i = 0; i < superNodesConfiguration.nodes.length; i++) {
  const node = superNodesConfiguration.nodes[i];
  const order = i + 1;
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
  applicationNode = System.getSuperNode(nodeName);
} else if (operationMode.toLowerCase() === "peer-node") {
  /*
    Peer node.
  */
  const port = parseInt(process.argv[4]);
  const resourceDirectory = process.argv[5];
  if (!port || !resourceDirectory) {
    console.log(
      "Usage: npx tsc && node build/index.js peer-node <node-name> <port> <resources-directory>"
    );
    process.exit(1);
  }
  applicationNode = new PeerNode(
    nodeName,
    "127.0.0.1",
    port,
    resourceDirectory
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

if (process.env.IS_CONTAINER) {
  applicationNode.setIsRunningInContainer(true);
}

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
