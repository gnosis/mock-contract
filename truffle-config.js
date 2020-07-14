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
      version: "^0.6.0",	
      settings: {	
        optimizer: {	
          enabled: true	
        },	
      }	
    }	
  }
};
