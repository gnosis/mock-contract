# MockContract

Simple Solidity contract to mock dependent contracts in truffle tests.

# Usage in your project

Install module from npm
```bash
npm i -D @gnosis.pm/mock-contract
```

Enable compilation of MockContract
* Add a new `Imports.sol` to the `contracts` folder of your project
* Copy the following code into `Imports.sol`:
```js
pragma solidity ^0.4.24;

// We import the contract so truffle compiles it, and we have the ABI 
// available when working from truffle console.
import "@gnosis.pm/mock-contract/contracts/MockContract.sol";
```