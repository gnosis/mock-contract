pragma solidity ^0.5.0;

import './ComplexInterface.sol';

contract SimpleContract {
    ComplexInterface complexInterface;
  
    constructor(address _complexInterface) public {
        complexInterface = ComplexInterface(_complexInterface);
    }
   
    function wrapperMethod(address addr) private view returns (uint, uint) {  
        return complexInterface.acceptAddressReturnUintUintView(addr);
    }
   
    function simpleMethodThatFails(address addr1, address addr2) public view returns (bool) {
        uint n = complexInterface.acceptUintReturnUintView(0);
        uint firstResult1;
        uint firstResult2;
        uint secondResult1;
        uint secondResult2;
        (firstResult1, firstResult2) = wrapperMethod(addr1);
        (secondResult1, secondResult2) = wrapperMethod(addr2);
        return firstResult1 == 1 && firstResult2 == 1 && secondResult1 == 2 && secondResult2 == 2;
    }
    
    function simpleMethodThatPasses(address addr1, address addr2) public view returns (bool) {
        uint firstResult1;
        uint firstResult2;
        uint secondResult1;
        uint secondResult2;
        (firstResult1, firstResult2) = wrapperMethod(addr1);
        (secondResult1, secondResult2) = wrapperMethod(addr2);
        return firstResult1 == 1 && firstResult2 == 1 && secondResult1 == 2 && secondResult2 == 2;
    }
}
