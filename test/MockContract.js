const utils = require('./utils')
const abi = require('ethereumjs-abi')
const MockContract = artifacts.require("./MockContract.sol")
const ComplexInterface = artifacts.require("./ComplexInterface.sol")

contract('MockContract', function(accounts) {

  describe("cleanState", function() {
    it("should return null if not mocked", async function() {
      const mock = await MockContract.new()
      const complex = ComplexInterface.at(mock.address)

      result = await complex.acceptAdressUintReturnBool.call("0x0", 10);
      assert.equal(result, false)
    });
  });

  describe("givenReturn", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10)
      await mock.givenReturn(encoded, abi.rawEncode(['bool'], [true]).toString())
        
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, true)
      // Check that other calls return default
      result = await complex.acceptAdressUintReturnBool.call("0x1", 10);
      assert.equal(result, false)

      // Check that we can reset return
      await mock.reset()
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, false)
    });
  });

  describe("givenRevert", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      await mock.givenRevert(encoded);

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

  describe("givenRevertWithMessage", function() {
      it("should revert if mocked and return message", async function() {
        const mock = await MockContract.new();
        const complex = ComplexInterface.at(mock.address)
  
        const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
        await mock.givenRevertWithMessage(encoded, "This is Sparta!!!");
  
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

  describe("givenOutOfGas", function() {
    it("should run out of gas if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      await mock.givenOutOfGas(encoded);

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
  describe("givenReturnAny", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const methodId = await complex.contract.acceptAdressUintReturnBool.getData(0,0);
      await mock.givenReturnAny(methodId, abi.rawEncode(['bool'], [true]).toString())

      // Check transactions and calls
      complex.acceptAdressUintReturnBool("0x0", 10)
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, true)

      complex.acceptAdressUintReturnBool("0x1", 12)
      result = await complex.acceptAdressUintReturnBool.call("0x1", 12)
      assert.equal(result, true)

      // Check that we can reset revert
      await mock.reset()
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10)
      assert.equal(result, false)
      result = await complex.acceptAdressUintReturnBool.call("0x1", 12)
      assert.equal(result, false)
    });
  });

  describe("givenRevertAny", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const methodId = await complex.contract.acceptAdressUintReturnBool.getData(0,0);
      await mock.givenRevertAny(methodId);

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

  describe("givenRevertAnyWithMessage", function() {
    it("should revert if mocked and return message", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const methodId = await complex.contract.acceptAdressUintReturnBool.getData(0,0);
      await mock.givenRevertAnyWithMessage(methodId, "This is Sparta!!!");

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

  describe("givenOutOfGasAny", function() {
    it("should run out of gas if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const methodId = await complex.contract.acceptAdressUintReturnBool.getData(0,0);
      await mock.givenOutOfGasAny(methodId);

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
      await mock.givenReturn(encoded, abi.rawEncode(['string'], ["return specific"]).toString());
      result = await complex.acceptUintReturnString.call(42);
      // Specific mock should be prioritized over any mock
      assert.equal(result, "return specific")

      await mock.givenRevert(encoded);
      await utils.assertRevert(complex.acceptUintReturnString(42))

      await mock.givenRevertWithMessage(encoded, "revert specific");
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "revert specific")

      await mock.givenOutOfGas(encoded);
      await utils.assertOutOfGas(complex.acceptUintReturnString(42))

      // Check that we can reset revert
      await mock.reset()
      // Transactions should be successful
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "")
    }

    it("all specific mocks should be prioritized over return any mock", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      // No mock set
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "")

      await mock.givenReturnAny(methodId, abi.rawEncode(['string'], ["return any"]).toString());
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "return any")

      await testSpecificMocks(mock, complex)
    });

    it("all specific mocks should be prioritized over revert any mock", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      // No mock set
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "")

      await mock.givenRevertAnyWithMessage(methodId, "revert any");
      await utils.assertRevert(complex.acceptUintReturnString(42))
      const encoded = await complex.contract.acceptUintReturnString.getData(42)
      error = await utils.getErrorMessage(complex.address, 0, encoded)
      assert.equal(error, "revert any")

      await testSpecificMocks(mock, complex)
    });

    it("all specific mocks should be prioritized over out of gas any mock", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      // No mock set
      result = await complex.acceptUintReturnString.call(42);
      assert.equal(result, "")

      await mock.givenOutOfGasAny(methodId);
      await utils.assertOutOfGas(complex.acceptUintReturnString(42))

      await testSpecificMocks(mock, complex)
    });
  });
});