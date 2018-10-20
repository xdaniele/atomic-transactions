pragma solidity ^0.4.15;


contract TimeLock{


    address owner;
    uint start;
    uint lockTime;

    constructor () public{
        owner = msg.sender;
    }

    modifier onlyOwner{
        require(owner == msg.sender,"You are not the owner!");
        _;
    }

    function Escrow(uint _lockTime) external onlyOwner  payable{
        lockTime = _lockTime;
        address(this).transfer(msg.value);
    }

    modifier lockFree{
        require((now - start) >= lockTime,"Not enough time has passed to unlock");
        _;
    }

    function GetFunds() external onlyOwner lockFree {
        owner.transfer(address(this).balance);
    }

}