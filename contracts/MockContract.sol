pragma solidity ^0.4.23;

contract MockContract {
	enum MockType { Return, Revert, OutOfGas }
	mapping(bytes => MockType) mockTypes;
	mapping(bytes => bytes) expectations;
	mapping(bytes => string) revertMessage;
	mapping(bytes4 => MockType) mockTypesAny;
	mapping(bytes4 => bytes) expectationsAny;
	mapping(bytes4 => string) revertMessageAny;

	/**
	 * @dev Stores a response that the contract will return if the fallback function is called with the given method name and matching arguments.
	 * @param call ABI encoded calldata that if invoked on this contract will return `response`. Parameter values need to match exactly.
	 * @param response ABI encoded response that will be returned if this contract is invoked with `call`
	 */
	function givenReturn(bytes call, bytes response) public {
		mockTypes[call] = MockType.Return;
		expectations[call] = response;
	}

	function givenReturnAny(bytes4 method, bytes response) public {
		mockTypesAny[method] = MockType.Return;
		expectationsAny[method] = response;
		emit Debug(method);
	}

	function givenRevert(bytes call) public {
		mockTypes[call] = MockType.Revert;
		revertMessage[call] = "";
	}

	function givenRevertWithMessage(bytes call, string message) public {
		mockTypes[call] = MockType.Revert;
		revertMessage[call] = message;
	}

	function givenRevertAny(bytes4 method) public {
		mockTypesAny[method] = MockType.Revert;
	}

	function givenRevertAnyWithMessage(bytes4 method, string message) public {
		mockTypesAny[method] = MockType.Revert;
		revertMessageAny[method] = message;
	}

	function givenOutOfGas(bytes call) public {
		mockTypes[call] = MockType.OutOfGas;
	}

	function givenOutOfGasAny(bytes4 method) public {
		mockTypesAny[method] = MockType.OutOfGas;
	}

	function reset(bytes call) public {
		mockTypes[call] = MockType.Return;
		expectations[call] = hex"";
		revertMessage[call] = "";
	}

	function resetAny(bytes4 method) public {
		mockTypesAny[method] = MockType.Return;
		expectationsAny[method] = hex"";
		revertMessageAny[method] = "";
	}

	event Debug(bytes4 value);
	function() payable public {
		bytes4 methodId;
		assembly {
			methodId := calldataload(0)
		}
		emit Debug(methodId);
		if (mockTypesAny[methodId] == MockType.Revert) {
			revert(revertMessageAny[methodId]);
		}
		if (mockTypes[msg.data] == MockType.Revert) {
			revert(revertMessage[msg.data]);
		}
		if (mockTypesAny[methodId] == MockType.OutOfGas || mockTypes[msg.data] == MockType.OutOfGas) {
			while(true) {
				assembly {
					sstore(sload(0x40), 1)
				}
			}
		}
		bytes memory result = expectationsAny[methodId];
		if (result.length == 0) {
			result = expectations[msg.data];
		}
		assembly {
			return(add(0x20, result), mload(result))
		}
	}
}
