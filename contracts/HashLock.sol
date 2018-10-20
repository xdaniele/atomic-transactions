pragma solidity ^0.4.15;

contract HashLock{
    
    bytes32 public hash;
    address public owner;
    
    constructor() public{
        owner = msg.sender;
    }
    
    modifier onlyOwner{
        require(owner == msg.sender,"Not the owner of contract!");
        _;
    }
    
    function Escrow(bytes32 _hash) external payable{
        hash = _hash;
        address(this).transfer(msg.value);
    }
    
    
    function Unlock(uint256 secret) external{
        require(keccak256(abi.encodePacked(secret)) == hash,"This is not the correct secret");
        msg.sender.transfer(address(this).balance);
    }
    
    
}