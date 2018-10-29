var HashedTimelock = artifacts.require("HashedTimelock");
var HashedTimelockERC20 = artifacts.require("HashedTimelockERC20");

module.exports = function(deployer){
    deployer.deploy(HashedTimelock);
    deployer.deploy(HashedTimelockERC20);
}
