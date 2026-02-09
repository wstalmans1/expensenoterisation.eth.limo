// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title Expense Registry
/// @author
/// @notice Stores user expenses on-chain
/// @dev Upgradeable via UUPS. Expenses are stored per user address.
/// @custom:security-contact security@example.com
contract ExpenseRegistry is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    /// @notice Expense entry stored per user
    /// @param date Unix timestamp (seconds)
    /// @param amount Arbitrary amount value
    /// @param description Short description of the expense
    struct Expense {
        uint64 date;
        uint256 amount;
        string description;
    }

    mapping(address => Expense[]) private expensesByUser;

    /// @notice Emitted when a new expense is added
    /// @param user The account that added the expense
    /// @param index The index of the newly added expense
    /// @param date Unix timestamp (seconds)
    /// @param amount Arbitrary amount value
    /// @param description Short description of the expense
    event ExpenseAdded(
        address indexed user,
        uint256 index,
        uint64 date,
        uint256 amount,
        string description
    );

    /// @notice Initializes the contract with an owner
    /// @param initialOwner The owner of the contract
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    /// @notice Adds a new expense for the sender
    /// @param date Unix timestamp (seconds)
    /// @param amount Arbitrary amount value
    /// @param description Short description of the expense
    function addExpense(uint64 date, uint256 amount, string calldata description) external {
        expensesByUser[msg.sender].push(Expense({
            date: date,
            amount: amount,
            description: description
        }));

        emit ExpenseAdded(
            msg.sender,
            expensesByUser[msg.sender].length - 1,
            date,
            amount,
            description
        );
    }

    /// @notice Returns all expenses for a user
    /// @param user The address to fetch expenses for
    /// @return expenses Array of stored expenses
    function getExpenses(address user) external view returns (Expense[] memory expenses) {
        return expensesByUser[user];
    }

    /// @dev Required by UUPS to authorize upgrades
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
