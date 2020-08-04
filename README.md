[![Build Status](https://travis-ci.org/gnosis/mock-contract.svg?branch=master)](https://travis-ci.org/gnosis/mock-contract)

# MockContract

Simple Solidity contract to mock dependencies in truffle tests. It enables you to
 - Make dependent contracts return predefined values for different methods and arguments
 - Simulate exceptions such as `revert` and `outOfGas`
 - Assert on how often a dependency is called
 
 *MockContract* allows for all of that without having to write a separate test contract each time.

# Usage in your project

Install module from npm
```bash
npm i -D @gnosis.pm/mock-contract
```

Enable compilation of MockContract
* Add a new `Imports.sol` to the `contracts` folder the project
* Copy the following code into `Imports.sol`:
```js
pragma solidity ^0.6.0;

// We import the contract so truffle compiles it, and we have the ABI 
// available when working from truffle console.
import "@gnosis.pm/mock-contract/contracts/MockContract.sol";
```
* Use in javascript unit test:
```
const MockContract = artifacts.require("./MockContract.sol")

// Instantiate mock and make it return true for any invocation
const mock = await MockContract.new()
await mock.givenAnyReturnBool(true)

// instantiate "object under test" with mocked contract.
const contractToTest = await ComplextContract.new(mock.address)
```

# Step by Step Example

Let's assume we want to test the following smart contract, which implements a simple bidding procedure:

```js
pragma solidity ^0.6.0;
import "./Token.sol";

/**
 * Contract that stores the highest bidder while securing payment from a given ERC20 Token.
 * Upon each bid the cost of bidding is incremented.
 */
contract SimpleAuction {
  address public captor; // Address of the highest bidder
  
  Token private token;
  uint256 private cost;

  constructor(Token _token) public {
    token = _token;
  }

  function bid() public {
    if (token.transferFrom(msg.sender, this, cost + 1)) {
      require(token.transfer(captor, cost), "Refund failed");
      captor = msg.sender;
      cost += 1;
    }
  }
}
```

If we were to write unit tests for this class, we would have to provide an implementation of an ERC20 token contract. There are commonly two ways to deal with that:
1. Use the real ERC20 token contract and configure it in a way that it will work for the test (e.g. call `token.approve` before bidding)
2. Implement a fake Token contract that instead of real logic contains dummy implementations (e.g. `return true` for everything)

The problem with 1) is that the logic required to make our dependency behave in the intended way can be very complex and incurs additional maintenance work. It also doesn't isolate our tests - instead of only testing the unit under test it is testing the integration of multiple components.

Solution 2) requires writing a *Fake* contract for each dependency. This takes time and pollutes the repository and migration files with a lot of non-production code.

## Mocking General Interactions

*MockContract* can act as a generic fake object for any type of contract. We can tell our mock what it should return upon certain invocations. For the example above, assume we want to write a test case where ERC20 transfers work just fine:

```js
const MockContract = artifacts.require("./MockContract.sol")
const SimpleAuction = artifacts.require("./SimpleAuction.sol")
...
it('updates the captor', async () => {
  const mock = await MockContract.new()
  const auction = await SimpleAuction.new(mock.address)

  const trueEncoded = web3.eth.abi.encodeParameter("bool", true)
  await mock.givenAnyReturnBool(trueEncoded)
  await auction.bid({from: accounts[0]})
  
  assert.equal(accounts[0], await auction.captor.call())
})
```

In particular `await mock.givenAnyReturnBool(true)` will make it so that mock returns `true` on any method invocation. 

A plain mock without any expectations will return *nullish* values by default (e.g. `false` for bool, `0` for uint, etc). 

There are convenience methods for other types such as `givenAnyReturnAddress` or `givenAnyReturnUint`. The full mock interface can be found [here](https://github.com/fleupold/mock-contract/blob/master/contracts/MockContract.sol#L3).

## Mocking Methods Individually

Now let's assume we want to test that the bid gets reverted if `token.transfer` succeeds but `token.transferFrom` fails:

```js
const Token = artifacts.require("./Token.sol")
...
it('should fail if we fail to refund', async () => {
  const mock = await MockContract.new()
  const auction = await SimpleAuction.new(mock.address)
  const token = await Token.new();

  const transferFrom = token.contract.methods.transferFrom(0, 0, 0).encodeABI() // arguments don't matter
  const transfer = token.contract.methods.transfer(0,0).encodeABI() // arguments don't matter

  await mock.givenMethodReturnBool(transferFrom, true)
  await mock.givenMethodReturnBool(transfer, false)

  try {
    await auction.bid({from: accounts[1]})
    assert.fail("Should have reverted")
  } catch (e) {}
})
```

Different methods have different ABI encodings. `mock.givenMethodReturnBool(bytes, boolean)` takes the ABI encoded methodId as a first parameter and will only replace behavior for this method. There are two ways to construct the methodId. We recommend using the `encodeABI` call on the original contract's ABI:

```js
// Arguments do not matter, mock will only extract methodId
const transferFrom = token.contract.transferFrom(0, 0, 0).encodeABI()
```

We could also create it manually using e.g.:

```js
const transferFrom = web3.sha3("transferFrom(address,address,uint256)").slice(0,10) // first 4 bytes
```

However, the latter approach is not type-safe and can lead to unexpected test behavior if the ABI on the original contract changes. The first approach would give a much more descriptive compilation error in that case.

Again there are convenience functions for other return types (e.g. `givenMethoReturnUint`). 

Mocked methods will take priority over mocks using  *any*.

## Mocking Methods & Arguments

We can also specify different behaviors for when the same method is called with different arguments:

```js
it('Keeps the old bidder if the new bidder fails to transfer', async () => {
  ...
  const transferFromA = token.contract.methods.transferFrom(accounts[0], auction.address, 1).encodeABI()
  const transferFromB = token.contract.methods.transferFrom(accounts[1], auction.address, 2).encodeABI()

  await mock.givenCalldataReturnBool(transferFromA, true)
  await mock.givenCalldataReturnBool(transferFromB, false)

  await auction.bid({from: accounts[0]})
  await auction.bid({from: accounts[1]})
      
  assert.equal(accounts[0], await auction.captor.call())
})
```

This time we need to provide the full `calldata`. We can easily use the original contract's ABI `encodeABI`call to generate it. Again, convenience functions for other return types exist (e.g. `givenMethoReturnUint`). 

Mocked calls with exact calldata will takes priority over *method* mocks and *any* mocks.

## Simulating Failure

We can also simulate EVM exceptions using `MockContract`. All methods are available for *any*, *method* and *calldata* specific calls:

```js
// Revert upon any invocation on mock without a specific message
await mock.givenAnyRevert()

// Revert upon any invocation of `methodId` with the specific message
await mock.givenMethodRevertWithMessage(methodId, "Some specific message")

// Run out of gas, if mock is called with `calldata`
await mock.givenCalldataRunOutOfGas(calldata)
```

## Inspect Invocations

It can sometime be useful to see how often a dependency has been called during a test-case. E.g. we might want to assert that `transfer` is not called if `transferFrom` failed in the first place:

```js
it('only does the second transfer if the first transfer succeed', async () => {
  ...
  await mock.givenAnyReturnBool(false)
  await auction.bid()

  const transfer = token.contract.methods.transfer(0,0).encodeABI()
  
  const invocationCount = await mock.invocationCountForMethod.call(transfer)
  assert.equal(0, invocationCount)
})
```

We can inspect the total invocation of `mock` for all methods combined using `await invocationCount.call()` and for individual arguments using `await invocationCountForCalldata.call(calldata)`.

## Resetting `mock`

We can override existing behavior throughout the lifetime of the test:

```js
await mock.givenAnyReturnBool(true) // will return true from now on
await auction.bid()
await mock.givenAnyReturnBool(false) // will return false from now on
await auction.bid()
```
Note that previously specified *method* and *calldata* based behavior will be unaffected by overriding *any* mock behavior. 

To completely reset all behavior and clear invocation counts, we can call:
```js
await mock.reset()
```

## Complex `return` types
If the methods for returning the most commonly used types are not enough, we can manually ABI encode our responses with arbitrary solidity types:

```js
const hello_world = web3.eth.abi.encodeParameter("string", 'Hello World!')
await mock.givenAnyReturn(hello_world);
```


---------------------------------------

*This is a work in progress and feedback is highly appreciated. Please open an issue on GitHub and/or submit a pull request.*
