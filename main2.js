var Client = require("./src/client/client");

var node1 = new Client('0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1', '0xc89ce4735882c9f0f0fe26686c53074e09b0d550');
node1.connectToNode("http://localhost:8545");
node1.handleTransaction("http://localhost:3000", 0, 10, 1);
