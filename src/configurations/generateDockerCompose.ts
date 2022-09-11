import fs from "fs";
import { BLUE, RESET } from "../utils/colors";
import superNodesConfiguration from "./super-nodes.json";
import peerNodesConfiguration from "./peer-nodes.json";

let dockerComposeContent = "";
dockerComposeContent += 'version: "3.9"\n';
dockerComposeContent += "services:\n";
dockerComposeContent += "  # Super nodes.\n";

for (let i = 0; i < superNodesConfiguration.nodes.length; i++) {
  const node = superNodesConfiguration.nodes[i];
  if (!["127.0.0.1", "localhost"].includes(node.address.toLowerCase())) {
    continue;
  }
  dockerComposeContent += `  super-node-${i + 1}:\n`;
  dockerComposeContent += `    container_name: super-node-${i + 1}\n`;
  dockerComposeContent += "    environment:\n";
  dockerComposeContent += `      - NODE_NAME=${node.name}\n`;
  dockerComposeContent += "    ports:\n";
  dockerComposeContent += `      - ${node.port}:${node.port}\n`;
  dockerComposeContent += "    build: .\n";
  dockerComposeContent += "    entrypoint: npm run super-node-container\n";
}

dockerComposeContent += "  # Peer Nodes.\n";
for (let i = 0; i < peerNodesConfiguration.nodes.length; i++) {
  const node = peerNodesConfiguration.nodes[i];
  dockerComposeContent += `  peer-node-${i + 1}:\n`;
  dockerComposeContent += `    container_name: peer-node-${i + 1}\n`;
  dockerComposeContent += "    environment:\n";
  dockerComposeContent += `      - NODE_NAME=${node.name}\n`;
  dockerComposeContent += `      - NODE_PORT=${node.port}\n`;
  dockerComposeContent += `      - RESOURCES_DIRECTORY=${node.resources_directory}\n`;
  dockerComposeContent += "    ports:\n";
  dockerComposeContent += `      - ${node.port}:${node.port}\n`;
  dockerComposeContent += "    build: .\n";
  dockerComposeContent += "    entrypoint: npm run peer-node-container\n";
}

try {
  fs.writeFileSync("docker-compose.yaml", dockerComposeContent);
  console.log(`[${BLUE}INFO${RESET}] docker-compose.yaml generated.\n`);
} catch (error) {
  console.error(`Unnable to write docker-compose.yml file: ${error}`);
}
