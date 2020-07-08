pragma solidity ^0.6.0;

import './ComplexInterface.sol';

contract ExampleContractUnderTest {
    ComplexInterface complexInterface;
  
    constructor(address _complexInterface) public {
        complexInterface = ComplexInterface(_complexInterface);
    }
   
    function callMockedFunction3Times() public view returns (bool) {
        complexInterface.acceptUintReturnUintView(1);
        complexInterface.acceptUintReturnUintView(1);
        complexInterface.acceptUintReturnUintView(1);
        return true;
    }

    function callMethodThatReturnsAddress() public returns (address) {
        address foo = complexInterface.acceptUintReturnAddress(1);
        return foo;
    }

    function callMethodThatReturnsBool() public returns (bool) {
        return complexInterface.acceptUintReturnBool(1);
    }
}
