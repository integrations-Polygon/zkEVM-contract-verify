// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MultiSigWallet is ReentrancyGuard {
    address[] private owners;
    uint256 public constant numConfirmationsRequired = 3;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }
    Transaction[] private transactions;

    // MAPPINGS
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    mapping(address => bool) public isOwner;

    // EVENTS
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );

    // MODIFIERS
    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }

    // CONSTRUCTOR
    constructor(address[] memory _owners) {
        require(_owners.length > 0, "owners required");
        for (uint256 i = 0; i < _owners.length; ) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");
            isOwner[owner] = true;
            owners.push(owner);
            unchecked {
                i++;
            }
        }
    }

    // FUNCTIONS
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint256 _value, bytes memory _data) external onlyOwner {
        uint256 txIndex = transactions.length;

        transactions.push(Transaction({ to: _to, value: _value, data: _data, executed: false, numConfirmations: 0 }));

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function confirmTransaction(
        uint256 _txIndex
    ) external onlyOwner txExists(_txIndex) notExecuted(_txIndex) notConfirmed(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(
        uint256 _txIndex
    ) external onlyOwner txExists(_txIndex) notExecuted(_txIndex) nonReentrant {
        Transaction storage transaction = transactions[_txIndex];

        require(transaction.numConfirmations >= numConfirmationsRequired, "cannot execute tx");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{ value: transaction.value }(transaction.data);
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint256 _txIndex) external onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(
        uint256 _txIndex
    ) external view returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations) {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    function getTransferData(address _recipient, uint256 _amount) external pure returns (bytes memory) {
        return abi.encodeWithSignature("transfer(address,uint256)", _recipient, _amount);
    }

    function getTransferFromData(
        address _sender,
        address _recipient,
        uint256 _amount
    ) external pure returns (bytes memory) {
        return abi.encodeWithSignature("transferFrom(address,address,uint256)", _sender, _recipient, _amount);
    }

    function getTransferOwnershipData(address _newOwner) external pure returns (bytes memory) {
        return abi.encodeWithSignature("transferOwnership(address)", _newOwner);
    }

    function getApproveData(address _spender, uint256 _amount) external pure returns (bytes memory) {
        return abi.encodeWithSignature("approve(address,uint256)", _spender, _amount);
    }

    function getIncreaseAllowanceData(address _spender, uint256 _addedValue) external pure returns (bytes memory) {
        return abi.encodeWithSignature("increaseAllowance(address,uint256)", _spender, _addedValue);
    }

    function getDecreaseAllowanceData(address _spender, uint256 _subtractedValue) external pure returns (bytes memory) {
        return abi.encodeWithSignature("decreaseAllowance(address,uint256)", _spender, _subtractedValue);
    }
}
