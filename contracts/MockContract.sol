pragma solidity ^0.4.23;

contract MockContract {
	enum MockType { Return, Revert, OutOfGas }
	
	bytes32 public constant MOCKS_LIST_START = 0x1;
	bytes public constant MOCKS_LIST_END = "0xff";
	bytes32 public constant MOCKS_LIST_END_HASH = keccak256(MOCKS_LIST_END);
	bytes4 public constant SENTINEL_ANY_MOCKS = 0x1;

	// A linked list allows easy iteration and inclusion checks
	mapping(bytes32 => bytes) mocks;
	mapping(bytes => MockType) mockTypes;
	mapping(bytes => bytes) expectations;
	mapping(bytes => string) revertMessage;

	mapping(bytes4 => bytes4) anyMocks;
	mapping(bytes4 => MockType) mockTypesAny;
	mapping(bytes4 => bytes) expectationsAny;
	mapping(bytes4 => string) revertMessageAny;

	constructor() {
		mocks[MOCKS_LIST_START] = MOCKS_LIST_END;
		anyMocks[SENTINEL_ANY_MOCKS] = SENTINEL_ANY_MOCKS;
	}

	function trackMock(bytes call) private {
		bytes32 callHash = keccak256(call);
		if (mocks[callHash].length == 0) {
			mocks[callHash] = mocks[MOCKS_LIST_START];
			mocks[MOCKS_LIST_START] = call;
		}
	}

	function trackAnyMock(bytes4 methodId) private {
		if (anyMocks[methodId] == 0x0) {
			anyMocks[methodId] = anyMocks[SENTINEL_ANY_MOCKS];
			anyMocks[SENTINEL_ANY_MOCKS] = methodId;
		}
	}

	/**
	 * @dev Stores a response that the contract will return if the fallback function is called with the given method name and matching arguments.
	 * @param call ABI encoded calldata that if invoked on this contract will return `response`. Parameter values need to match exactly.
	 * @param response ABI encoded response that will be returned if this contract is invoked with `call`
	 */
	function givenReturn(bytes call, bytes response) public {
		mockTypes[call] = MockType.Return;
		expectations[call] = response;
		trackMock(call);
	}

	function givenReturnAny(bytes4 method, bytes response) public {
		mockTypesAny[method] = MockType.Return;
		expectationsAny[method] = response;
		trackAnyMock(method);		
	}

	function givenRevert(bytes call) public {
		mockTypes[call] = MockType.Revert;
		revertMessage[call] = "";
		trackMock(call);
	}

	function givenRevertAny(bytes4 method) public {
		mockTypesAny[method] = MockType.Revert;
		trackAnyMock(method);		
	}

	function givenRevertWithMessage(bytes call, string message) public {
		mockTypes[call] = MockType.Revert;
		revertMessage[call] = message;
		trackMock(call);
	}

	function givenRevertAnyWithMessage(bytes4 method, string message) public {
		mockTypesAny[method] = MockType.Revert;
		revertMessageAny[method] = message;
		trackAnyMock(method);		
	}

	function givenOutOfGas(bytes call) public {
		mockTypes[call] = MockType.OutOfGas;
		trackMock(call);
	}

	function givenOutOfGasAny(bytes4 method) public {
		mockTypesAny[method] = MockType.OutOfGas;
		trackAnyMock(method);	
	}

	function reset() public {
		// Reset all exact mocks
		bytes memory nextMock = mocks[MOCKS_LIST_START];
		bytes32 mockHash = keccak256(nextMock);
		// We cannot compary bytes
		while(mockHash != MOCKS_LIST_END_HASH) {
			// Reset all mock maps
			mockTypes[nextMock] = MockType.Return;
			expectations[nextMock] = hex"";
			revertMessage[nextMock] = "";
			// Set next mock to remove
			nextMock = mocks[mockHash];
			// Remove from linked list
			mocks[mockHash] = "";
			// Update mock hash
			mockHash = keccak256(nextMock);
		}
		// Clear list
		mocks[MOCKS_LIST_START] = MOCKS_LIST_END;

		// Reset all any mocks
		bytes4 nextAnyMock = anyMocks[SENTINEL_ANY_MOCKS];
		while(nextAnyMock != SENTINEL_ANY_MOCKS) {
			bytes4 currentAnyMock = nextAnyMock;
			mockTypesAny[currentAnyMock] = MockType.Return;
			expectationsAny[currentAnyMock] = hex"";
			revertMessageAny[currentAnyMock] = "";
			nextAnyMock = anyMocks[currentAnyMock];
			// Remove from linked list
			anyMocks[currentAnyMock] = 0x0;
		}
		// Clear list
		anyMocks[SENTINEL_ANY_MOCKS] = SENTINEL_ANY_MOCKS;
	}

	function useAllGas() private {
		while(true) {
			assembly {
				sstore(sload(0x40), 1)
			}
		}
	}

	function() payable public {
		bytes4 methodId;
		assembly {
			methodId := calldataload(0)
		}
		if (mockTypes[msg.data] == MockType.Revert) {
			revert(revertMessage[msg.data]);
		}
		if (mockTypes[msg.data] == MockType.OutOfGas) {
			useAllGas();
		}
		bytes memory result = expectations[msg.data];

		// Check any mocks if there is no expected result
		if (result.length == 0) {
			if (mockTypesAny[methodId] == MockType.Revert) {
				revert(revertMessageAny[methodId]);
			}
			if (mockTypesAny[methodId] == MockType.OutOfGas) {
				useAllGas();
			}
			result = expectationsAny[methodId];
		}
		assembly {
			return(add(0x20, result), mload(result))
		}
	}
}
