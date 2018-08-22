const MockContract = artifacts.require("./MockContract.sol");
const ComplexInterface = artifacts.require("./ComplexInterface.sol");;
const abi = require('ethereumjs-abi')

contract('MockContract', function(accounts) {
  describe("givenReturn", function() {
    it("should return the mocked value", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      await mock.givenReturn(encoded, abi.rawEncode(['bool'], [true]).toString());
        
      result = await complex.acceptAdressUintReturnBool.call("0x0", 10);
      assert.equal(result, true)
    });

    it("should return null if not mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      result = await complex.acceptAdressUintReturnBool.call("0x0", 10);
      assert.equal(result, false)
    });
  });

  describe("givenRevert", function() {
    it("should revert if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      await mock.givenRevert(encoded);
        
      try {
        result = await complex.acceptAdressUintReturnBool.call("0x0", 10);
        assert.fail("Should have reverted");
      } catch(error) {
        assert.equal(error.message, "VM Exception while processing transaction: revert");
      }
    });
  });

  describe("outOfGas", function() {
    it("should run out of gas if mocked", async function() {
      const mock = await MockContract.new();
      const complex = ComplexInterface.at(mock.address)

      const encoded = await complex.contract.acceptAdressUintReturnBool.getData("0x0", 10);
      await mock.givenOutOfGas(encoded);
        
      try {
        result = await complex.acceptAdressUintReturnBool.call("0x0", 10);
        assert.fail("Should have run out of gas");
      } catch(error) {
        assert.equal(error.message, "VM Exception while processing transaction: out of gas");
      }
    });
  });
});