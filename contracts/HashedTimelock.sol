pragma solidity ^0.4.24;
pragma experimental "v0.5.0";

/**
 * @title Hashed Timelock Contracts (HTLCs) on Ethereum ETH.
 *
 * This contract provides a way to create and keep HTLCs for ETH.
 *
 * See HashedTimelockERC20.sol for a contract that provides the same functions
 * for ERC20 tokens.
 *
 * Protocol:
 *
 *  1) newContract(receiver, hashlock, timelock) - a sender calls this to create
 *      a new HTLC and gets back a 32 byte contract id
 *  2) unlock(contractId, secret) - once the receiver and sender know each other's
 *      hash secrets they can call the unlock function. When both have unlocked the
 *      funds, they are transfered to the receiver.
 *  3) refund() - after timelock has expired and if the receiver did not
 *      unlock funds the sender / creater of the HTLC can get their ETH
 *      back with this function.
 */
contract HashedTimelock {

    event LogHTLCNew(
        bytes32 indexed contractId,
        address indexed sender,
        address indexed receiver,
        uint amount,
        bytes32 senderHashlock,
        bytes32 receiverHashlock,
        uint timelock,
    );
    event LogHTLCUnlock(bytes32 indexed contractId, address unlocker);
    event LogHTLCWithdraw(bytes32 indexed contractId);
    event LogHTLCRefund(bytes32 indexed contractId);

    struct LockContract {
        address sender;
        address receiver;
        uint amount;
        mapping(address => bytes32) hashlocks;
        uint timelock; // UNIX timestamp seconds - locked UNTIL this time
        bool withdrawn;
        bool refunded;
        mapping(address => bytes32) secrets;
    }

    modifier fundsSent() {
        require(msg.value > 0, "msg.value must be > 0");
        _;
    }
    modifier futureTimelock(uint _time) {
        // only requirement is the timelock time is after the last blocktime (now).
        // probably want something a bit further in the future then this.
        // but this is still a useful sanity check:
        require(_time > now, "timelock time must be in the future");
        _;
    }
    modifier contractExists(bytes32 _contractId) {
        require(haveContract(_contractId), "contractId does not exist");
        _;
    }
    modifier hashlockMatches(bytes32 _contractId, bytes32 _x) {
        require(
            contracts[_contractId].hashlocks[msg.sender] == sha256(abi.encodePacked(_x)),
            "hashlock hash does not match"
        );
        _;
    }
    modifier unlockable(bytes32 _contractId) {
        address receiver = contracts[_contractId].receiver;
        address sender = contracts[_contractId].sender;
        require(sender == msg.sender || receiver == msg.sender, "unlockable: not receiver or sender");
        require(contracts[_contractId].withdrawn == false, "unlockable: already withdrawn");
        require(contracts[_contractId].timelock > now, "unlockable: timelock time must be in the future");
        _;
    }
    modifier refundable(bytes32 _contractId) {
        require(sender == msg.sender, "refundable: not sender");
        require(contracts[_contractId].refunded == false, "refundable: already refunded");
        require(contracts[_contractId].withdrawn == false, "refundable: already withdrawn");
        require(contracts[_contractId].timelock <= now, "refundable: timelock not yet passed");
        _;
    }

    mapping (bytes32 => LockContract) contracts;

    /**
     * @dev Sender sets up a new hash time lock contract depositing the ETH and
     * providing the reciever lock terms.
     *
     * @param _receiver Receiver of the ETH.
     * @param _hashlock A sha-2 sha256 hash hashlock.
     * @param _timelock UNIX epoch seconds time that the lock expires at.
     *                  Refunds can be made after this time.
     * @return contractId Id of the new HTLC. This is needed for subsequent
     *                    calls.
     */
    function newContract(
      address _receiver,
      bytes32 _senderHashlock,
      bytes32 _receiverHashlock,
      uint _timelock
    )
        external
        payable
        fundsSent
        futureTimelock(_timelock)
        returns (bytes32 contractId)
    {
        contractId = sha256(
            abi.encodePacked(
                msg.sender,
                _receiver,
                msg.value,
                _senderHashlock,
                _receiverHashlock,
                _timelock,
            )
        );

        // Reject if a contract already exists with the same parameters. The
        // sender must change one of these parameters to create a new distinct
        // contract.
        if (haveContract(contractId))
            revert();

        mapping(address => bytes32) _hashlocks;
        _hashlocks[msg.sender] = _senderHashlock;
        _hashlocks[_receiver] = _receiverHashlock;

        mapping(address => bytes32) _secrets;
        _secrets[msg.sender] = 0x0;
        _secrets[_receiver] = 0x0;

        contracts[contractId] = LockContract(
            msg.sender,
            _receiver,
            msg.value,
            _hashlocks,
            _timelock,
            false,
            false,
            _secrets,
        );

        emit LogHTLCNew(
            contractId,
            msg.sender,
            _receiver,
            msg.value,
            _senderHashlock,
            _receiverHashlock,
            _timelock,
        );
    }

    /**
     * @dev Called twice (once by the sender and once by the receiver) before
     * funds are transfered to receiver. Funds are transfered the second time
     * unlock is called, regardless of who calls it.
     * @param _contractId Id of the HTLC.
     * @param _secret sha256(_secret) should equal the msg.sender's hashlock.
     * @return bool true on success
     */
    function unlock(bytes32 _contractId, bytes32 _secret)
        external
        contractExists(_contractId)
        hashlockMatches(_contractId, _secret)
        unlockable(_contractId)
        returns (bool withdrawn)
    {
        LockContract storage c = contracts[_contractId];
        c.secrets[msg.sender] = _secret;
        emit LogHTLCUnlock(_contractId, msg.sender);
        if (c.secrets[c.receiver] != 0x0 && c.secrets[c.sender] != 0x0) {
          c.withdrawn = true;
          c.receiver.transfer(c.amount);
          emit LogHTLCWithdraw(_contractId);
          return true;
        }
        return false;
    }

    /**
     * @dev Called by the sender if there was no withdraw AND the time lock has
     * expired. This will refund the contract amount.
     *
     * @param _contractId Id of HTLC to refund from.
     * @param _secret preimage of msg.sender's hashlock.
     * @return bool true on success
     */
    function refund(bytes32 _contractId, bytes32 _secret)
        external
        contractExists(_contractId)
        hashlockMatches(_contractId, _secret)
        refundable(_contractId)
        returns (bool refunded)
    {
        LockContract storage c = contracts[_contractId];
        if (c.secrets[c.receiver] == 0x0) {
          c.refunded = true;
          c.sender.transfer(c.amount);
          emit LogHTLCRefund(_contractId);
          return true;
        }
        return false;
    }

    /**
     * @dev Get contract details.
     * @param _contractId HTLC contract id
     * @return All parameters in struct LockContract for _contractId HTLC
     */
    function getContract(bytes32 _contractId)
        public
        view
        returns (
            address sender,
            address receiver,
            uint amount,
            bytes32 hashlock,
            uint timelock,
            bool withdrawn,
            bool refunded,
            bytes32 preimage
        )
    {
        if (haveContract(_contractId) == false)
            return;
        LockContract storage c = contracts[_contractId];
        return (c.sender, c.receiver, c.amount, c.hashlock, c.timelock,
        c.withdrawn, c.refunded, c.preimage);
    }

    /**
     * @dev Is there a contract with id _contractId.
     * @param _contractId Id into contracts mapping.
     */
    function haveContract(bytes32 _contractId)
        internal
        view
        returns (bool exists)
    {
        exists = (contracts[_contractId].sender != address(0));
    }

}
