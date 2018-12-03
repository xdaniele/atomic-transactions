Beginnings of atomic-transactions package

Getting started:

Run ganache-cli -d to run a local copy of the ganache blockchain

Run truffle compile followed by truffle migrate to deploy the contracts to the blockchain

Note the value of the TestToken address

Next, create the transaction manager:

    -Run node manager-cli.js which will launch the manager-cli prompt
    -Run create_manager --pk <private_key> --p <chat_port> --ta <test_token_address>
    -Run connect --a <ganache_node_address>

Then create two new clients. For each client run:

    -Start the client via node client-cli.js which launches the prompt
    -Run create_client --pk <private_key> --ta <test_token_address> --t <test_id> (Set test_id = 0 for first client and test_id = 1 for second client)
    -Run connect --a <ganache_node_address>
    -Run start_transaction --t <type = WEI_TO_COIN | COIN_TO_WEI> --w <wei_amount> --m <manager_address>

Once you run start_tranasction from both clients, you should see the transaction go through each step and complete

Smart Contract Testing:

To test the HTLC contracts, make sure ganache is running and then run truffle test
