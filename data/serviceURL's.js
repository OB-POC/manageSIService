let env = process.env.NODE_ENV || ""

module.exports = env == "PRO" ? {
    loginUrl: 'http://localhost:8082/authService',
    accountUrl: 'http://localhost:8082/accountsService',
    payOutUrl: 'http://localhost:8082/payOutPlanService',
    offeringsUrl: 'http://localhost:8082/offeringService',
    optimizeFundsUrl: 'http://localhost:8082/optimizeFundsService',
    dbUrl: 'http://localhost:8082/dbService'
} : {
    loginUrl: 'http://localhost:3000/authService',
    accountUrl: 'http://localhost:3001/accountsService',
    payOutUrl: 'http://localhost:3002/payOutPlanService',
    offeringsUrl: 'http://localhost:3003/offeringService',
    optimizeFundsUrl: 'http://localhost:3005/optimizeFundsService',
    dbUrl: 'http://localhost:5000/dbService'
};
