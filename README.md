# Trabalho 1 de Progração Distribuída

Trabalho 1 de Progração Distribuída.

## Como Rodar

1. Baixe o [Node.js](https://nodejs.org/en/download/), é recomendado que se utilize versões ^16.15.1.

2. Baixe o [Docker](https://www.docker.com/products/docker-desktop/), essa ferramenta é **obrigatória** para o funcionamento do sistema.

3. Clone esse repositório, vá para o diretório do projeto e execute os seguinte comandos:

```sh
npm install
```

```sh
npm start
```

O comando 'npm start' irá:

1. Ler as configurações definidas de Super Nodes e Peer Nodes em `src/configurations/nodes`.

2. Gerar um arquivo docker-compose com base nessas configurações para subir 1 contâiner para cada nodo.

3. Gerar arquivos JSON em `src/configurations/requests` para cada Peer Node definido. Será através desses arquivos que faremos os pedidos de recursos por parte de cada nodo peer.

4. Subir os contâineres Docker aplicando o docker-compose.yaml gerado.

### Por Que Preciso do Node.js em Minha Máquina?

É necessário ter o Node.js em sua máquina e não somente dentro dos contâineres porque o processo de geração do docker-compose.yaml para subir os contâineres e dos arquivos JSON dos nodos peers é feito utilizando um script TypeScript, o qual só pode ser executado através do Node.js.

## Alterando as Configurações de Nodos

- **Super Nodos**: Altere o arquivo `src/configurations/nodes/super-nodes.json`.

- **Nodos Peer**: Altere o arquivo `src/configurations/nodes/peer-nodes.json`.

**OBS**: Use endereços de IPs entre `172.24.2.1` e `172.24.2.254`.

## Solicitando Recursos

Para que não fosse necessário input do usuário via terminal na aplicação que será rodada dentro dos contâineres, o grupo optou por uma abordagem em que os pedidos de recursos dos nodos peers são feitos através de arquivos compartilhados entre os contâineres e a máquina host. Para isso, foram utilizados volumes do tipo 'bind' na definição do docker-compose.yaml.

Conforme dito anteriormente, quando o comando 'npm start' é executado, um arquivo JSON é criado para cada nodo peer definido em sua configuração. Sendo assim, para solicitar recursos, altere esses arquivos com os pedidos de recursos que desejar em `src/configurations/requests`. A aplicação detectará mudanças nesses arquivos e irá tomar as ações necessárias. Exemplo:

**Arquivo:** peer-node-carlos.json

```json
{
  "resourceNames": ["batman.txt", "the-c-language.txt"]
}
```

No exemplo acima, estamos fazendo com que o nodo peer 'Carlos' solicite ao seu super nodo os recursos 'batman.txt' e 'the-c-language.txt'.
