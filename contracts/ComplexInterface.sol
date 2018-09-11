pragma solidity ^0.4.23;

interface ComplexInterface {
    function acceptAdressUintReturnBool(address recipient, uint amount) external returns (bool);
    function acceptUintReturnString(uint) external returns (string memory);
}