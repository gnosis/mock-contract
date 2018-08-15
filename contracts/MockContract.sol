pragma solidity ^0.4.23;

contract MockContract {
	mapping(bytes => bytes) expectations;

	/**
	 * @dev Stores a response that the contract will return if the fallback function is called with the given method name and matching arguments.
	 * @param call ABI encoded calldata that if invoked on this contract will return `response`. Parameter values need to match exactly.
	 * @param response ABI encoded response that will be returned if this contract is invoked with `call`
	 */
	function givenReturn(bytes call, bytes response) public {
		expectations[call] = response;
	}

	function() payable public {
		bytes memory result = expectations[msg.data];
		uint resultSize = result.length;
		assembly {
			return(add(0x20, result), resultSize)
		}
	}
}