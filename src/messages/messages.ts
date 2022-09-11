export interface Message {
  type: string;
}

export interface RegisterMessage extends Message {
  type: "register";
  name: string;
  port: number;
  // ???
  content: string;
}

export interface RegisterResponseMessage extends Message {
  type: "registerResponse";
  name: string;
  status: "success" | "failure";
}

export interface KeepAliveMessage extends Message {
  type: "keepAlive";
  name: string;
}
