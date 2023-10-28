const { sqlForPartialUpdate } = require("./sql");

describe("createToken", function () {
  test("works: not admin", function () {
    let user = {
      //prepared object with data
      name: "Aliya",
      email: "aliya@yahoo.com",
      subscriptionExpired: true,
    };
    let keysInTableDataBase = {
      //prepared possible sql columns names
      name: "first_name",
      email: "e_email",
      subscriptionExpired: "subscription_expired",
    };
    let expectedOutput = {
      // hard coded expected result
      setCols: '"first_name"=$1, "e_email"=$2, "subscription_expired"=$3',
      values: ["Aliya", "aliya@yahoo.com", true],
    };

    let result = sqlForPartialUpdate(user, keysInTableDataBase); //here we get calculated result

    expect(result).toEqual(expectedOutput); //compared calculated result with expected result
  });
});
