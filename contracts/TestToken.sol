pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";



contract TestToken is StandardToken{
    constructor(address[] initialRecipients) public{
        for(uint i = 0;i < initialRecipients.length;i++){
            balances[initialRecipients[i]] = 10;
        }
    }   
}
