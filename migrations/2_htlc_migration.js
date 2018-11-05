var HashedTimelock = artifacts.require("HashedTimelock");
var HashedTimelockERC20 = artifacts.require("HashedTimelockERC20");
var TestToken = artifacts.require('TestToken');

//The addresses specified in the deployment of TestToken give each user listed 10 tokens

const testAddresses = ["0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1","0xffcf8fdee72ac11b5c542428b35eef5769c409f0","0x22d491bde2303f2f43325b2108d26f1eaba1e32b"];

module.exports = function(deployer){
    deployer.deploy(HashedTimelock);
    deployer.deploy(HashedTimelockERC20);
    deployer.deploy(TestToken,testAddresses);
}
