import fs from "fs";
import { BLUE, RESET } from "../utils/colors";
import superNodesConfiguration from "./super-nodes.json";

let dockerComposeContent = "";
dockerComposeContent += 'version: "3.9"\n';
dockerComposeContent += "services:\n";
dockerComposeContent += "  # Super nodes.\n";

for (let i = 0; i < superNodesConfiguration.nodes.length; i++) {
  const node = superNodesConfiguration.nodes[i];
  if (!["127.0.0.1", "localhost"].includes(node.address.toLowerCase())) {
    continue;
  }
  dockerComposeContent += `  ${node.name}:\n`;
  dockerComposeContent += `    container_name: ${node.name}\n`;
  dockerComposeContent += "    environment:\n";
  dockerComposeContent += `      - NODE_NAME=${node.name}\n`;
  dockerComposeContent += "    ports:\n";
  dockerComposeContent += `      - ${node.port}:${node.port}\n`;
  dockerComposeContent += "    build: .\n";
  dockerComposeContent += "    entrypoint: npm run start-supernode-container\n";
}

try {
  fs.writeFileSync("docker-compose.yaml", dockerComposeContent);
  console.log(`[${BLUE}INFO${RESET}] docker-compose.yaml generated.\n`);
} catch (error) {
  console.error(`Unnable to write docker-compose.yml file: ${error}`);
}
