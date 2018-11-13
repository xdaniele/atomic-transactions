var Manager = require("./src/manager/manager");

var manager = new Manager("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",3000, '0xc89ce4735882c9f0f0fe26686c53074e09b0d550');
manager.connectToNode("http://localhost:8545");
