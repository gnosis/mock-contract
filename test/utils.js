const abi = require("ethereumjs-abi");

async function assertRejects(q, msg, errorPredicate) {
    let res, error = false
    try {
        res = await q
    } catch(e) {
        error = e
    } finally {
        if(!error)
            assert.fail(res, null, msg)
        else if (errorPredicate)
            errorPredicate(error)
    }
    return res
}

async function assertRevert(q) {
    const msg = "Should have reverted"
    await assertRejects(q, msg, (err) => {
        assert.ok(!err.message.includes("after consuming all gas"), msg)
    })
}

async function assertOutOfGas(q) {
    const msg = "Should have run out of gas"
    await assertRejects(q, msg, (err) => {
        assert.ok(err.message.includes("after consuming all gas"), msg)
    })
}

async function getErrorMessage(to, value, data, from) {
    let returnData = await web3.eth.call({to: to, from: from, value: value, data: data})
    let returnBuffer = Buffer.from(returnData.slice(2), "hex")
    return abi.rawDecode(["string"], returnBuffer.slice(4))[0]
}

// Only for tests, as its fixed to default web3: http://localhost:8545
async function getRPCResult(params) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            method: "eth_call",
            params,
            jsonrpc: "2.0",
            id: new Date().getTime()
        }, (e, result) => (e ? reject(e) : resolve(result)))
    })
}

Object.assign(exports, {
    assertRejects,
    getErrorMessage,
    assertOutOfGas,
    assertRevert,
    getRPCResult
})