const utils = require('./utils')
const abi = require('ethereumjs-abi')
const MockContract = artifacts.require("./MockContract.sol")
const ComplexInterface = artifacts.require("./ComplexInterface.sol")
const ExampleContractUnderTest = artifacts.require("./ExampleContractUnderTest.sol")

contract('MockContract', function(accounts) {

  describe("cleanState", function() {
    it("should return null if not mocked", async function() {
      const mock = await MockContract.new()
      const complex = ComplexInterface.at(mock.address)

      result = await complex.acceptAdressUintReturnBool.call("0x0", 10);
      assert.equal(result, false)
    });
  });

  describe("givenAnyReturn", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      await mock.givenAnyReturn(abi.rawEncode(['bool'], [true]).toString())
        
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, true)

      // Check that other methods also return true
      result = await complex.acceptUintReturnBool.call(10);
      assert.equal(result, true)

      // Check that we can reset
      await mock.reset()
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, false)

      // Check convenience methods
      await mock.givenAnyReturnBool(true)
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, true)

      await mock.givenAnyReturnUint(42)
      result = await complex.contract.acceptUintReturnUint.call(7);
      assert.equal(result, 42)

      await mock.givenAnyReturnAddress(accounts[0])
      result = await complex.contract.acceptUintReturnAddress.call(7);
      assert.equal(result, accounts[0])
    });
  });

  describe("givenAnyRevert", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      await mock.givenAnyRevert();

      // On error it should return the error message for a call
      const encoded = await complex.contract.methodA.getData();
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
      const complex = ComplexInterface.at(mock.address)

      await mock.givenAnyRevertWithMessage("This is Sparta!!!");

      // On error it should return the error message for a call
      const encoded = await complex.contract.methodA.getData();
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
      const complex = ComplexInterface.at(mock.address)

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
      const complex = ComplexInterface.at(mock.address)

      let encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10)
      await mock.givenCalldataReturn(encoded, abi.rawEncode(['bool'], [true]).toString())
        
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, true)
      // Check that other calls return default
      result = await complex.acceptAdressUintReturnBool.call("0x1", 10);
      assert.equal(result, false)

      // Check that we can reset
      await mock.reset()
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, false)

      // Check convenience methods
      await mock.givenCalldataReturnBool(encoded, true)
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, true)

      encoded = await complex.contract.acceptUintReturnUint.getData(7);
      await mock.givenCalldataReturnUint(encoded, 42)
      result = await complex.contract.acceptUintReturnUint.call(7);
      assert.equal(result, 42)

      encoded = await complex.contract.acceptUintReturnAddress.getData(7);
      await mock.givenCalldataReturnAddress(encoded, accounts[0])
      result = await complex.contract.acceptUintReturnAddress.call(7);
      assert.equal(result, accounts[0])
    });

    it("should allow mocking the same method with different paramters", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      encodedA = await complex.contract.acceptUintReturnUint.getData(7);
      encodedB = await complex.contract.acceptUintReturnUint.getData(8);

      await mock.givenCalldataReturnUint(encodedA, 7)
      await mock.givenCalldataReturnUint(encodedB, 8)

      let result = await complex.acceptUintReturnUint.call(7)
      assert.equal(7, result)

      result = await complex.acceptUintReturnUint.call(8)
      assert.equal(8, result)
    });
      
    it("should call method 3 times and return constant in 1 transaction", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)
      const exampleContract = await ExampleContractUnderTest.new(mock.address);

      mock.givenAnyReturnUint(1)
      const result = await exampleContract.callMockedFunction3Times()
      assert.equal(result, true)
    });      
  })

  describe("givenCalldataRevert", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      await mock.givenCalldataRevert(encoded);

      // On error it should return the error message for a call
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")
      // Check that other calls return default
      result = await complex.acceptAdressUintReturnBool.call("0x1", 10);
      assert.equal(result, false)

      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0", 10))

      // Check that we can reset revert
      await mock.reset()
      // Transaction should be successful
      await complex.acceptAdressUintReturnBool("0x0", 10)
    });
  });

  describe("givenCalldataRevertWithMessage", function() {
      it("should revert if mocked and return message", async function() {
        const mock = await MockContract.new();
        const complex = ComplexInterface.at(mock.address)
  
        const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
        await mock.givenCalldataRevertWithMessage(encoded, "This is Sparta!!!");
  
        // On error it should return the error message for a call
        error = await utils.getErrorMessage(complex.address, 0, encoded)
        assert.equal(error, "This is Sparta!!!")
  
        await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0", 10))

        // Check that other calls return default
        result = await complex.acceptAdressUintReturnBool.call("0x1", 10);
        assert.equal(result, false)
  
        // Check that we can reset revert
        await mock.reset()
        // Transactions should be successful
        await complex.acceptAdressUintReturnBool("0x0", 10)
      });
  });

  describe("givenCalldataRunOutOfGas", function() {
    it("should run out of gas if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      await mock.givenCalldataRunOutOfGas(encoded);

      // On error it should return the error message for a call
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")

      await utils.assertOutOfGas(complex.acceptAdressUintReturnBool("0x0", 10))

      // Check that other calls return default
      result = await complex.acceptAdressUintReturnBool.call("0x1", 10);
      assert.equal(result, false)

      // Check that we can reset revert
      await mock.reset()
      // Transaction should be successful
      await complex.acceptAdressUintReturnBool("0x0", 10)
    });
  });

  /*
   * Tests for "any" functionality
   */
  describe("givenMethodReturn", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      let methodId = await complex.contract.acceptAdressUintReturnBool.getData(0,0);
      await mock.givenMethodReturn(methodId, abi.rawEncode(['bool'], [true]).toString())

      // Check transactions and calls
      complex.acceptAdressUintReturnBool("0x0", 10)
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, true)

      complex.acceptAdressUintReturnBool("0x1", 12)
      result = await complex.acceptAdressUintReturnBool.call("0x1", 12)
      assert.equal(result, true)

      // Check that we can reset mock
      await mock.reset()
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, false)
      result = await complex.acceptAdressUintReturnBool.call("0x1", 12)
      assert.equal(result, false)

      // Check convenience methods
      await mock.givenMethodReturnBool(methodId, true)
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, true)

      methodId = await complex.contract.acceptUintReturnUint.getData(0);
      await mock.givenMethodReturnUint(methodId, 42)
      result = await complex.contract.acceptUintReturnUint.call(0);
      assert.equal(result, 42)

      methodId = await complex.contract.acceptUintReturnAddress.getData(0);
      await mock.givenMethodReturnAddress(methodId, accounts[0])
      result = await complex.contract.acceptUintReturnAddress.call(0);
      assert.equal(result, accounts[0])
    });
  });

  describe("givenMethodRevert", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const methodId = await complex.contract.acceptAdressUintReturnBool.getData(0,0);
      await mock.givenMethodRevert(methodId);

      // On error it should return the error message for a call
      var encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")
      encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x1", 12);
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")

      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0", 10))
      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x1", 12))

      // Check that we can reset revert
      await mock.reset()
      // Transactions should be successful
      await complex.acceptAdressUintReturnBool("0x0", 10)
      await complex.acceptAdressUintReturnBool("0x1", 12)
    });
  });

  describe("givenMethodRevertWithMessage", function() {
    it("should revert if mocked and return message", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const methodId = await complex.contract.acceptAdressUintReturnBool.getData(0,0);
      await mock.givenMethodRevertWithMessage(methodId, "This is Sparta!!!");

      // On error it should return the error message for a call
      var encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "This is Sparta!!!")
      encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x1", 12);
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "This is Sparta!!!")

      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x0", 10))
      await utils.assertRevert(complex.acceptAdressUintReturnBool("0x1", 12))

      // Check that we can reset revert
      await mock.reset()
      // Transactions should be successful
      await complex.acceptAdressUintReturnBool("0x0", 10)
      await complex.acceptAdressUintReturnBool("0x1", 12)
    });
  });

  describe("givenMethodRunOutOfGas", function() {
    it("should run out of gas if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const methodId = await complex.contract.acceptAdressUintReturnBool.getData(0,0);
      await mock.givenMethodRunOutOfGas(methodId);

      // On error it should return the error message for a call
      var encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")
      encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x1", 12);
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "")

      await utils.assertOutOfGas(complex.acceptAdressUintReturnBool("0x0", 10))
      await utils.assertOutOfGas(complex.acceptAdressUintReturnBool("0x1", 12))

      // Check that we can reset revert
      await mock.reset()
      // Transactions should be successful
      await complex.acceptAdressUintReturnBool("0x0", 10)
      await complex.acceptAdressUintReturnBool("0x1", 12)
    });
  });

  describe("test mock priority", function() {

    const methodId = "0x" + abi.methodID("acceptUintReturnString", ["uint"]).toString("hex")
    const testSpecificMocks = async function (mock, complex) {
      const encoded = await complex.contract.acceptUintReturnString.getData(42)
      await mock.givenCalldataReturn(encoded, abi.rawEncode(['string'], ["return specific"]).toString());
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
      const request = complex.acceptUintReturnString.request([42])
      response = await utils.getRPCResult(request.params);
      assert.equal(response.result, "0x")
    }

    it("all specific mocks should be prioritized over return any mock", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      // No mock set
      const request = complex.acceptUintReturnString.request([42])
      response = await utils.getRPCResult(request.params);
      assert.equal(response.result, "0x")

      // Fallback mock set
      await mock.givenAnyReturn(abi.rawEncode(['string'], ["fallback"]).toString())
      response = await utils.getRPCResult(request.params);
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "fallback")

      // MethodId mock set
      await mock.givenMethodReturn(methodId, abi.rawEncode(['string'], ["methodId"]).toString());
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "methodId")

      await testSpecificMocks(mock, complex)
    });

    it("all specific mocks should be prioritized over revert any mock", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      // No mock set
      const request = complex.acceptUintReturnString.request([42])
      response = await utils.getRPCResult(request.params);
      assert.equal(response.result, "0x")

      const encoded = await complex.contract.acceptUintReturnString.getData(42)

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
      const complex = ComplexInterface.at(mock.address)

      // No mock set
      const request = complex.acceptUintReturnString.request([42])
      response = await utils.getRPCResult(request.params);
      assert.equal(response.result, "0x")

      // Fallback mock set
      await mock.givenAnyReturn(abi.rawEncode(['string'], ["fallback"]).toString())
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
      const complex = ComplexInterface.at(mock.address)

      const calldata = await complex.contract.acceptUintReturnString.getData(42)

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
      const complex = ComplexInterface.at(mock.address)

      let methodId = await complex.contract.acceptUintReturnUintView.getData(0);
      await mock.givenMethodReturn(methodId, abi.rawEncode(['uint'], [7]).toString())

      result = await complex.acceptUintReturnUintView.call(0)
      assert.equal(result.toNumber(), 7)
    });
  });
});
