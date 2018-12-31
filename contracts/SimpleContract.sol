pragma solidity ^0.5.0;

import './ComplexInterface.sol';

contract SimpleContract {
    ComplexInterface complexInterface;
  
    constructor(address _complexInterface) public {
        complexInterface = ComplexInterface(_complexInterface);
    }
   
    function callMockedFunction3Times() public view returns (bool) {
        // commenting out any of the calls below should pass the tests
        complexInterface.acceptUintReturnUintView(0);
        complexInterface.acceptUintReturnUintView(1);
        complexInterface.acceptUintReturnUintView(2);
        return true;
    }
  
    function callMockedFunction2Times() public view returns (bool) {
        complexInterface.acceptUintReturnUintView(0);
        complexInterface.acceptUintReturnUintView(1);
        return true;
    }
}
