pragma solidity ^0.4.23;

interface MockInterface {
	/**
	 * @dev After calling this method, the mock will return `response` when the given
	 * methodId is called regardless of arguments. If the methodId and arguments
	 * are mocked more specifically (using `givenMethodAndArguments`) the latter
	 * will take precedence.
	 * @param method ABI encoded methodId. It is valid to pass full calldata (including arguments). The mock will extract the methodId from it
	 * @param response ABI encoded response that will be returned if method is invoked
	 */
	function givenMethodReturn(bytes method, bytes response) external;

	function givenMethodRevert(bytes method) external;
	function givenMethodRevertWithMessage(bytes method, string message) external;
	function givenMethodRunOutOfGas(bytes method) external;

	/**
	 * @dev After calling this method, the mock will return `response` when the given
	 * methodId is called with matching arguments. These exact mocks will take
	 * precedence over all other mocks.
	 * @param calldata ABI encoded calldata (methodId and arguments)
	 * @param response ABI encoded response that will be returned if contract is invoked with calldata
	 */
	function givenCalldataReturn(bytes calldata, bytes response) external;

	function givenCalldataRevert(bytes calldata) external;
	function givenCalldataRevertWithMessage(bytes calldata, string message) external;
	function givenCalldataRunOutOfGas(bytes calldata) external;

	/**
	 * @dev Resets all mocked methods and invocation counts.
	 */
	 function reset() external;
}

/**
 * Implementation of the MockInterface.
 */
contract MockContract is MockInterface {
	enum MockType { Return, Revert, OutOfGas }
	
	bytes32 public constant MOCKS_LIST_START = hex"01";
	bytes public constant MOCKS_LIST_END = "0xff";
	bytes32 public constant MOCKS_LIST_END_HASH = keccak256(MOCKS_LIST_END);
	bytes4 public constant SENTINEL_ANY_MOCKS = hex"01";

	// A linked list allows easy iteration and inclusion checks
	mapping(bytes32 => bytes) mocks;
	mapping(bytes => MockType) mockTypes;
	mapping(bytes => bytes) expectations;
	mapping(bytes => string) revertMessage;

	mapping(bytes4 => bytes4) anyMocks;
	mapping(bytes4 => MockType) mockTypesAny;
	mapping(bytes4 => bytes) expectationsAny;
	mapping(bytes4 => string) revertMessageAny;

	constructor() public {
		mocks[MOCKS_LIST_START] = MOCKS_LIST_END;
		anyMocks[SENTINEL_ANY_MOCKS] = SENTINEL_ANY_MOCKS;
	}

	function trackMock(bytes memory call) private {
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

	function givenCalldataReturn(bytes call, bytes response) external  {
		mockTypes[call] = MockType.Return;
		expectations[call] = response;
		trackMock(call);
	}

	function givenMethodReturn(bytes call, bytes response) external {
		bytes4 method = bytesToBytes4(call);
		mockTypesAny[method] = MockType.Return;
		expectationsAny[method] = response;
		trackAnyMock(method);		
	}

	function givenCalldataRevert(bytes call) external {
		mockTypes[call] = MockType.Revert;
		revertMessage[call] = "";
		trackMock(call);
	}

	function givenMethodRevert(bytes call) external {
		bytes4 method = bytesToBytes4(call);
		mockTypesAny[method] = MockType.Revert;
		trackAnyMock(method);		
	}

	function givenCalldataRevertWithMessage(bytes call, string message) external {
		mockTypes[call] = MockType.Revert;
		revertMessage[call] = message;
		trackMock(call);
	}

	function givenMethodRevertWithMessage(bytes call, string message) external {
		bytes4 method = bytesToBytes4(call);
		mockTypesAny[method] = MockType.Revert;
		revertMessageAny[method] = message;
		trackAnyMock(method);		
	}

	function givenCalldataRunOutOfGas(bytes call) external {
		mockTypes[call] = MockType.OutOfGas;
		trackMock(call);
	}

	function givenMethodRunOutOfGas(bytes call) external {
		bytes4 method = bytesToBytes4(call);
		mockTypesAny[method] = MockType.OutOfGas;
		trackAnyMock(method);	
	}

	function reset() external {
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
			bool s;
			assembly {
				//expensive call to EC multiply contract
				s := call(sub(gas, 2000), 6, 0, 0x0, 0xc0, 0x0, 0x60)
			}
		}
	}

	function bytesToBytes4(bytes b) private pure returns (bytes4) {
  		bytes4 out;
  		for (uint i = 0; i < 4; i++) {
    		out |= bytes4(b[i] & 0xFF) >> (i * 8);
  		}
  		return out;
	}

	function() payable external {
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
