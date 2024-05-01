const { hexToString, stringToHex } = require("viem");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

// calculate simple interest
function calculateSimpleInterest(principal, rate, time) {
  const simpleInterest = (principal * rate * time) / 100;

  console.log(
    `The simple interest is $${simpleInterest} and the total cumulated after ${time} years is ${
      `$` + (principal + simpleInterest)
    }`
  );

  // Return the result
  return principal + simpleInterest;
}

// { "method": "compound", "principal": 2000, "rate": 5, "time": 3 , "compoundFrequency":"yearly" }

// calculate compound interest

function calculateCompoundInterest(principal, rate, time, compoundFrequency) {
  // Convert the annual rate from a percentage to a decimal
  rate = rate / 100;

  // Determine the number of times interest applied per time period
  let n;
  switch (compoundFrequency.toLowerCase()) {
    case "yearly":
      n = 1;
      break;
    case "semiannually":
      n = 2;
      break;
    case "quarterly":
      n = 4;
      break;
    case "monthly":
      n = 12;
      break;
    case "daily":
      n = 365;
      break;
    default:
      throw new Error(
        "Invalid compounding frequency. Choose from yearly, semiannually, quarterly, monthly, or daily."
      );
  }

  // Calculate the compound interest
  const amount = principal * Math.pow(1 + rate / n, n * time);

  console.log(
    `The accumulated amount after ${time} years is $${amount.toFixed(2)}`
  );

  // Return the total accumulated amount (principal + interest)
  return amount;
}

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));
  const payloadString = hexToString(data.payload);
  console.log(`Converted payload: ${payloadString}`); // Log to debug

  try {
    const payload = JSON.parse(payloadString); // Parse the JSON string into an object
    console.log(payload.method, payload.principal, payload.rate, payload.time);

    if (payload.method === "simple") {
      const output = calculateSimpleInterest(
        payload.principal,
        payload.rate,
        payload.time
      );

      const outputStr = stringToHex(output);

      await fetch(rollup_server + "/notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: outputStr }),
      });
    } else if (payload.method === "compound") {
      const compoundOutput = calculateCompoundInterest(
        payload.principal,
        payload.rate,
        payload.time,
        payload.compoundFrequency
      );

      const outputStr = stringToHex(compoundOutput);

      await fetch(rollup_server + "/notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: outputStr }),
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
  }
  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
