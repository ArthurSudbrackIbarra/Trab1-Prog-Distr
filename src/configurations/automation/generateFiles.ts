import fs from "fs";
import { BLUE, GREEN, RESET, YELLOW } from "../../utils/colors";
import superNodesConfiguration from "../nodes/super-nodes.json";
import peerNodesConfiguration from "../nodes/peer-nodes.json";

/*
  Generating docker-compose.yaml file.
*/

console.log(`--- ${BLUE}Generating docker-compose.yaml file${RESET} ---\n`);

const DOCKER_COMPOSE_FILE_PATH = "docker-compose.yaml";

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
  dockerComposeContent += "    ports:\n";
  dockerComposeContent += `      - ${node.port}:${node.port}/udp\n`;
  dockerComposeContent += "    build: .\n";
  dockerComposeContent += `    entrypoint: npm run as-super-node "${node.name}"\n`;
}

const jsonFileNames: string[] = [];

dockerComposeContent += "  # Peer Nodes.\n";
for (let i = 0; i < peerNodesConfiguration.nodes.length; i++) {
  const node = peerNodesConfiguration.nodes[i];
  jsonFileNames.push(node.name);
  dockerComposeContent += `  peer-node-${i + 1}:\n`;
  dockerComposeContent += `    container_name: peer-node-${i + 1}\n`;
  dockerComposeContent += "    ports:\n";
  dockerComposeContent += `      - ${node.port}:${node.port}/udp\n`;
  dockerComposeContent += "    build: .\n";
  dockerComposeContent += `    volumes:\n`;
  dockerComposeContent += `      - type: bind\n`;
  dockerComposeContent += `        source: ./src/configurations/requests/${node.name}.json\n`;
  dockerComposeContent += `        target: /home/trab-1-prog-distr/build/configurations/requests/${node.name}.json\n`;
  dockerComposeContent += `    entrypoint: npm run as-peer-node "${node.name}" "${node.port}" "${node.resources_directory}"\n`;
}

try {
  fs.writeFileSync(DOCKER_COMPOSE_FILE_PATH, dockerComposeContent);
  console.log(`[${GREEN}OK${RESET}] docker-compose.yaml generated.\n`);
} catch (error) {
  console.error(`Unnable to write docker-compose.yml file: ${error}`);
}

/*
  Generating peer nodes requests .json files.
*/

console.log(
  `--- ${BLUE}Generating peer nodes resource request JSON files${RESET} ---\n`
);

const REQUESTS_DIRECTORY_PATH = "src/configurations/requests";
fs.readdirSync(REQUESTS_DIRECTORY_PATH).forEach((file) => {
  fs.unlinkSync(`${REQUESTS_DIRECTORY_PATH}/${file}`);
});
const defaultContent = {
  requests: [
    {
      name: "example-name",
    },
  ],
};
for (const fileName of jsonFileNames) {
  try {
    fs.writeFileSync(
      `src/configurations/requests/${fileName}.json`,
      JSON.stringify(defaultContent, null, 2)
    );
    console.log(`[${GREEN}OK${RESET}] ${fileName}.json generated.`);
  } catch (error) {
    console.error(`Unnable to write ${fileName}.json file: ${error}`);
  }
}

console.log(
  `\n${YELLOW}=> ${RESET}Por favor, antes de continuar, leia o README do projeto com as instruções de como operar o sistema.\n`
);
console.log("Pressione qualquer tecla para continuar...");
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("data", process.exit.bind(process, 0));
