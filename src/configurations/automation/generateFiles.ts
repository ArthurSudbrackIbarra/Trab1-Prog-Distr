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
dockerComposeContent += `networks:
  nodes_network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.24.2.0/16
`;
dockerComposeContent += "services:\n";
dockerComposeContent += "  # Super nodes.\n";

for (const node of superNodesConfiguration.nodes) {
  dockerComposeContent += `  ${node.name}:\n`;
  dockerComposeContent += `    container_name: ${node.name}\n`;
  dockerComposeContent += `    networks:\n`;
  dockerComposeContent += `      nodes_network:\n`;
  dockerComposeContent += `        ipv4_address: ${node.address}\n`;
  dockerComposeContent += "    build: .\n";
  dockerComposeContent += `    entrypoint: npm run as-super-node -- "${node.name}"\n`;
}

dockerComposeContent += "  # Peer Nodes.\n";
for (const node of peerNodesConfiguration.nodes) {
  dockerComposeContent += `  ${node.name}:\n`;
  dockerComposeContent += `    container_name: ${node.name}\n`;
  dockerComposeContent += `    networks:\n`;
  dockerComposeContent += `      nodes_network:\n`;
  dockerComposeContent += `    volumes:\n`;
  dockerComposeContent += `      - type: bind\n`;
  dockerComposeContent += `        source: ./src/configurations/requests/${node.name}.json\n`;
  dockerComposeContent += `        target: /home/trab-1-prog-distr/build/configurations/requests/${node.name}.json\n`;
  dockerComposeContent += "    build: .\n";
  dockerComposeContent += `    entrypoint: npm run as-peer-node -- "${node.name}" "${node.port}" "${node.resources_directory}"\n`;
}

try {
  fs.writeFileSync(DOCKER_COMPOSE_FILE_PATH, dockerComposeContent);
  console.log(`[${GREEN}OK${RESET}] docker-compose.yaml generated.\n`);
} catch (error) {
  console.error(`Unnable to write docker-compose.yml file: ${error}`);
  process.exit(1);
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
for (const node of peerNodesConfiguration.nodes) {
  const fileName = `${node.name}.json`;
  try {
    fs.writeFileSync(
      `src/configurations/requests/${fileName}`,
      JSON.stringify(defaultContent, null, 2)
    );
    console.log(`[${GREEN}OK${RESET}] ${fileName} generated.`);
  } catch (error) {
    console.error(`Unnable to write ${fileName} file: ${error}`);
    process.exit(1);
  }
}

console.log(
  `\n${YELLOW}=> ${RESET}Por favor, antes de continuar, leia o README do projeto com as instruções de como operar o sistema.\n`
);
console.log("Pressione qualquer tecla para continuar...\n");
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("data", process.exit.bind(process, 0));
