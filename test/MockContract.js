const utils = require('./utils')
const MockContract = artifacts.require("./MockContract.sol")
const ComplexInterface = artifacts.require("./ComplexInterface.sol")
const ExampleContractUnderTest = artifacts.require("./ExampleContractUnderTest.sol")

contract('MockContract', function(accounts) {

  describe("cleanState", function() {
    it("should return null if not mocked", async function() {
      const mock = await MockContract.new()
      const complex = await ComplexInterface.at(mock.address)

      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10);
      assert.equal(result, false)
    });

    it("should return null if not mocked when called by contract under test", async function() {
      const mock = await MockContract.new()
      const exampleContract = await ExampleContractUnderTest.new(mock.address);

      result = await exampleContract.callMethodThatReturnsBool.call();
      assert.equal(result, false)
    });
  });

  describe("givenAnyReturn", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      await mock.givenAnyReturn(web3.eth.abi.encodeParameter("bool", true))

      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, true)

      // Check that other methods also return true
      result = await complex.acceptUintReturnBool.call(10);
      assert.equal(result, true)

      // Check that we can reset
      await mock.reset()
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, false)

      // Check convenience methods
      await mock.givenAnyReturnBool(true)
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, true)

      await mock.givenAnyReturnUint(42)
      result = await complex.acceptUintReturnUint.call(7);
      assert.equal(result, 42)

      await mock.givenAnyReturnAddress(accounts[0])
      result = await complex.acceptUintReturnAddress.call(7);
      assert.equal(result, accounts[0])
    });
  });

  describe("givenAnyRevert", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      await mock.givenAnyRevert();

      // On error it should return the error message for a call
      const encoded = await complex.contract.methods.methodA().encodeABI();
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")
      await utils.assertRevert(complex.methodA())

      // Check that other calls also error
      await utils.assertRevert(complex.methodB())

      // Check that we can reset revert
      await mock.reset()

      // Transaction should be successful
      await complex.methodA()
    });
  });

  describe("givenAnyRevertWithMessage", function() {
    it("should revert if mocked and return message", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      await mock.givenAnyRevertWithMessage("This is Sparta!!!");

      // On error it should return the error message for a call
      const encoded = await complex.contract.methods.methodA().encodeABI();
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "This is Sparta!!!")
      await utils.assertRevert(complex.methodA())

      // Check that other calls also error
      await utils.assertRevert(complex.methodB())

      // Check that we can reset revert
      await mock.reset()

      // Transaction should be successful
      await complex.methodA()
    });
  });

  describe("givenAnyRunOutOfGas", function() {
    it("should run out of gas if mocked", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      await mock.givenAnyRunOutOfGas()

      await utils.assertOutOfGas(complex.methodA())

      // Check that other calls also run out of gas
      await utils.assertOutOfGas(complex.methodB())

      // Check that we can reset revert
      await mock.reset()
      // Transaction should be successful
      await complex.methodA()
    });
  });

  describe("givenCalldataReturn", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      let encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10).encodeABI()
      await mock.givenCalldataReturn(encoded, web3.eth.abi.encodeParameter("bool", true))

      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, true)
      // Check that other calls return default
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000001", 10);
      assert.equal(result, false)

      // Check that we can reset
      await mock.reset()
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, false)

      // Check convenience methods
      await mock.givenCalldataReturnBool(encoded, "true")
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, true)

      encoded = await complex.contract.methods.acceptUintReturnUint(7).encodeABI();
      await mock.givenCalldataReturnUint(encoded, 42)
      result = await complex.acceptUintReturnUint.call(7);
      assert.equal(result, 42)

      encoded = await complex.contract.methods.acceptUintReturnAddress(7).encodeABI();
      await mock.givenCalldataReturnAddress(encoded, accounts[0])
      result = await complex.acceptUintReturnAddress.call(7);
      assert.equal(result, accounts[0])
    });

    it("should allow mocking the same method with different paramters", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      encodedA = await complex.contract.methods.acceptUintReturnUint(7).encodeABI();
      encodedB = await complex.contract.methods.acceptUintReturnUint(8).encodeABI();

      await mock.givenCalldataReturnUint(encodedA, 7)
      await mock.givenCalldataReturnUint(encodedB, 8)

      let result = await complex.acceptUintReturnUint.call(7)
      assert.equal(7, result)

      result = await complex.acceptUintReturnUint.call(8)
      assert.equal(8, result)
    });

    it("should allow contract under test to call mocked method 3 times in 1 transaction", async function() {
      const mock = await MockContract.new();
      const exampleContract = await ExampleContractUnderTest.new(mock.address);

      mock.givenAnyReturnUint(1)
      const result = await exampleContract.callMockedFunction3Times()
      assert.equal(result, true)
    });
  })

  describe("givenCalldataRevert", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      const encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10).encodeABI();
      await mock.givenCalldataRevert(encoded);

      // On error it should return the error message for a call
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")
      // Check that other calls return default
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000001", 10);
      assert.equal(result, false)

      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10))

      // Check that we can reset revert
      await mock.reset()
      // Transaction should be successful
      await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10)
    });
  });

  describe("givenCalldataRevertWithMessage", function() {
      it("should revert if mocked and return message", async function() {
        const mock = await MockContract.new();
        const complex = await ComplexInterface.at(mock.address)

        const encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10).encodeABI();
        await mock.givenCalldataRevertWithMessage(encoded, "This is Sparta!!!");

        // On error it should return the error message for a call
        error = await utils.getErrorMessage(complex.address, 0, encoded)
        assert.equal(error, "This is Sparta!!!")

        await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10))

        // Check that other calls return default
        result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000001", 10);
        assert.equal(result, false)

        // Check that we can reset revert
        await mock.reset()
        // Transactions should be successful
        await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10)
      });
  });

  describe("givenCalldataRunOutOfGas", function() {
    it("should run out of gas if mocked", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      const encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10).encodeABI();
      await mock.givenCalldataRunOutOfGas(encoded);

      // On error it should return the error message for a call
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")

      await utils.assertOutOfGas(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10))

      // Check that other calls return default
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000001", 10);
      assert.equal(result, false)

      // Check that we can reset revert
      await mock.reset()
      // Transaction should be successful
      await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10)
    });
  });

  /*
   * Tests for "any" functionality
   */
  describe("givenMethodReturn", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      let methodId = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000",0).encodeABI();
      await mock.givenMethodReturn(methodId, web3.eth.abi.encodeParameter("bool", true))

      // Check transactions and calls
      complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10)
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, true)

      complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12)
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000001", 12)
      assert.equal(result, true)

      // Check that we can reset mock
      await mock.reset()
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, false)
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000001", 12)
      assert.equal(result, false)

      // Check convenience methods
      await mock.givenMethodReturnBool(methodId, true)
      result = await complex.acceptAdressUintReturnBool.call("0x0000000000000000000000000000000000000000", 10)
      assert.equal(result, true)

      methodId = await complex.contract.methods.acceptUintReturnUint(0).encodeABI();
      await mock.givenMethodReturnUint(methodId, 42)
      result = await complex.acceptUintReturnUint.call(0);
      assert.equal(result, 42)

      methodId = await complex.contract.methods.acceptUintReturnAddress(0).encodeABI();
      await mock.givenMethodReturnAddress(methodId, accounts[0])
      result = await complex.acceptUintReturnAddress.call(0);
      assert.equal(result, accounts[0])
    });

    it("should mock method returning an address which can be used in `contract under test`", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)
      const exampleContract = await ExampleContractUnderTest.new(mock.address);

      const methodId = await complex.contract.methods.acceptUintReturnAddress(0).encodeABI();
      await mock.givenMethodReturnAddress(methodId, accounts[0]);

      await exampleContract.callMethodThatReturnsAddress();
    });
  });

  describe("givenMethodRevert", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      const methodId = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000",0).encodeABI();
      await mock.givenMethodRevert(methodId);

      // On error it should return the error message for a call
      var encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10).encodeABI();
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")
      encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12).encodeABI();
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")

      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10))
      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12))

      // Check that we can reset revert
      await mock.reset()
      // Transactions should be successful
      await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10)
      await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12)
    });
  });

  describe("givenMethodRevertWithMessage", function() {
    it("should revert if mocked and return message", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      const methodId = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000",0).encodeABI();
      await mock.givenMethodRevertWithMessage(methodId, "This is Sparta!!!");

      // On error it should return the error message for a call
      var encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10).encodeABI();
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "This is Sparta!!!")
      encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12).encodeABI();
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "This is Sparta!!!")

      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10))
      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12))

      // Check that we can reset revert
      await mock.reset()
      // Transactions should be successful
      await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10)
      await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12)
    });
  });

  describe("givenMethodRunOutOfGas", function() {
    it("should run out of gas if mocked", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      const methodId = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000",0).encodeABI();
      await mock.givenMethodRunOutOfGas(methodId);

      // On error it should return the error message for a call
      var encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10).encodeABI();
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")
      encoded = await complex.contract.methods.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12).encodeABI();
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")

      await utils.assertOutOfGas(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10))
      await utils.assertOutOfGas(complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12))

      // Check that we can reset revert
      await mock.reset()
      // Transactions should be successful
      await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000000", 10)
      await complex.acceptAdressUintReturnBool("0x0000000000000000000000000000000000000001", 12)
    });
  });

  describe("test mock priority", function() {

    const methodId = web3.eth.abi.encodeFunctionSignature("acceptUintReturnString(uint256)");
    const testSpecificMocks = async function (mock, complex) {
      const encoded = await complex.contract.methods.acceptUintReturnString(42).encodeABI()
      await mock.givenCalldataReturn(encoded, web3.eth.abi.encodeParameter("string","return specific"));
      result = await complex.acceptUintReturnString.call(42);
      // Specific mock should be prioritized over any mock
      assert.equal(result, "return specific")

      await mock.givenCalldataRevert(encoded);
      await utils.assertRevert(complex.acceptUintReturnString(42))

      await mock.givenCalldataRevertWithMessage(encoded, "revert specific");
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "revert specific")

      await mock.givenCalldataRunOutOfGas(encoded);
      await utils.assertOutOfGas(complex.acceptUintReturnString(42))

      // Check that we can reset revert
      await mock.reset()
      // Transactions should be successful
      const response = await complex.acceptUintReturnString.call(42)
      assert.equal(response, "")
    }

    it("all specific mocks should be prioritized over return any mock", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      // No mock set
      const response = await complex.acceptUintReturnString.call(42)
      assert.equal(response, "")

      // Fallback mock set
      await mock.givenAnyReturn(web3.eth.abi.encodeParameter("string", "fallback"))
      let result = await complex.acceptUintReturnString.call(42)
      assert.equal(result, "fallback")

      // MethodId mock set
      await mock.givenMethodReturn(methodId, web3.eth.abi.encodeParameter("string", "methodId"));
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "methodId")

      await testSpecificMocks(mock, complex)
    });

    it("all specific mocks should be prioritized over revert any mock", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      // No mock set
      const response = await complex.acceptUintReturnString.call(42)
      assert.equal(response, "")

      const encoded = await complex.contract.methods.acceptUintReturnString(42).encodeABI()

      // Fallback mock set
      await mock.givenAnyRevertWithMessage('revert fallback')
      await utils.assertRevert(complex.acceptUintReturnString(42))
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "revert fallback")

      // MethodId mock set
      await mock.givenMethodRevertWithMessage(methodId, "revert method");
      await utils.assertRevert(complex.acceptUintReturnString(42))
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "revert method")

      await testSpecificMocks(mock, complex)
    });

    it("all specific mocks should be prioritized over out of gas any mock", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      // No mock set
      const response = await complex.acceptUintReturnString.call(42)
      assert.equal(response, "")

      // Fallback mock set
      await mock.givenAnyReturn(web3.eth.abi.encodeParameter("string", "fallback"))
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "fallback")

      // MethodId mock set
      await mock.givenMethodRunOutOfGas(methodId);
      await utils.assertOutOfGas(complex.acceptUintReturnString(42))

      await testSpecificMocks(mock, complex)
    });
  });

  describe("invocationCount", function() {
    it("returns the correct invocation count", async function() {
      const mock = await MockContract.new()
      const complex = await ComplexInterface.at(mock.address)

      const calldata = await complex.contract.methods.acceptUintReturnString(42).encodeABI()

      // Initially everything at 0
      let count = await mock.invocationCount.call()
      assert.equal(count, 0)

      count = await mock.invocationCountForMethod.call(calldata)
      assert.equal(count, 0)

      count = await mock.invocationCountForCalldata.call(calldata)
      assert.equal(count, 0)

      // Make a few calls and assert count
      await complex.methodA();
      await complex.acceptUintReturnString(42);
      await complex.acceptUintReturnString(-1);

      count = await mock.invocationCount.call()
      assert.equal(count, 3)

      count = await mock.invocationCountForMethod.call(calldata)
      assert.equal(count, 2)

      count = await mock.invocationCountForCalldata.call(calldata)
      assert.equal(count, 1)

      // After reset everything at 0 again
      await mock.reset()
      count = await mock.invocationCount.call()
      assert.equal(count, 0)
      count = await mock.invocationCountForMethod.call(calldata)
      assert.equal(count, 0)
      count = await mock.invocationCountForCalldata.call(calldata)
      assert.equal(count, 0)
    });
  });

  describe("givenMethodReturn for view functions", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = await ComplexInterface.at(mock.address)

      let methodId = await complex.contract.methods.acceptUintReturnUintView(0).encodeABI();
      await mock.givenMethodReturn(methodId, web3.eth.abi.encodeParameter("uint", 7))

      result = await complex.acceptUintReturnUintView(0)
      assert.equal(result.toNumber(), 7)
    });
  });
});
