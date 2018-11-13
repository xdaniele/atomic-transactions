var Client = require("./src/client/client");

var node2 = new Client('0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c', '0xc89ce4735882c9f0f0fe26686c53074e09b0d550');
node2.connectToNode("http://localhost:8545");
node2.handleTransaction("http://localhost:3000", 1, 10, 1);
