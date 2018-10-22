module.exports = {
    mongourl: process.env.MONGO || "mongodb://localhost",
    debug: false,
    persistentMonitoring : false,
    gui : {
        port: process.env.PORT || '5000'
    },
    restServer: {
        port: 8080
    },
    coapServer:{
        port: 5683
    }
}