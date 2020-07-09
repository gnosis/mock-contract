module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "v0.6.2",
      settings: {
        optimizer: {
          enabled: true
        },
      }
    }
  }
};
