pragma solidity ^0.5.0;

/**
 * @dev Used for unit testing MockContract functionality.
 */
interface ComplexInterface {
	function methodA() external;
	function methodB() external;
    function acceptAdressUintReturnBool(address recipient, uint amount) external returns (bool);
    function acceptUintReturnString(uint) external returns (string memory);
    function acceptUintReturnBool(uint) external returns (bool);
    function acceptUintReturnUint(uint) external returns (uint);
    function acceptUintReturnAddress(uint) external returns (address);
    function acceptUintReturnUintView(uint) external view returns (uint);
}

contract ComplexTest {
    ComplexInterface complex;

    constructor(address _complex) public {
        require(_complex != address(0));
        complex = ComplexInterface(_complex);
    }

    function testViewFunc(uint _n) public view returns (uint) {
        return complex.acceptUintReturnUintView(_n);
    }
}
