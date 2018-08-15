const MockContract = artifacts.require("./MockContract.sol");
const ComplexInterface = artifacts.require("./ComplexInterface.sol");;
const ComplexInterfaceAbi = require("./../build/contracts/ComplexInterface.json")["abi"];

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
});