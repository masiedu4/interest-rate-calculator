# Interest Rate Calculator

New to Cartesi? Don't worry! This is simple JavaScript dApp built on Cartesi calculates and returns the simple/compound returns. 

It has 2 features.

- **Simple Interest**: It calculates the simple interest based on the principal amount, rate of interest, and time period.
- **Compound Interest**: It calculates the compound interest based on the principal amount, rate of interest, time period, and the number of times the interest is compounded.

The application entrypoint is the `src/index.js` file and has all the source code. It is bundled with [esbuild](https://esbuild.github.io), but any bundler can be used.


## Installation

1. Download the latest version of [Node.js](https://nodejs.org/en/download/).

2. Download the Cartesi CLI by running the following command:

	```shell
	npm install -g @cartesi/cli
	```

3. Docker Desktop is a must-have requirement for building dApps Cartesi. Download it from [here](https://www.docker.com/products/docker-desktop).

## Create a new project

1. Create a new project using the Cartesi CLI

	```shell
	cartesi create <app-name> --template <language>
	```

	Example:
	
	```shell
	cartesi create interest-rate-calculator --template javascript
	```

2. Change directory to the project and install viem. 

	```shell
	cd interest-rate-calculator
	npm install viem
	```

3. Import the utility functions from the viem library in the `src/index.js` file.

	```javascript
	const { hexToString, stringToHex } = require("viem");
	```

## Write the application logic

The application logic is written in the `src/index.js` file. The file contains the logic for calculating simple and compound interest.

### Simple Interest

Create a helper function to calculate the simple interest:

```javascript
function calculateSimpleInterest(principal, rate, time) {
  const simpleInterest = (principal * rate * time) / 100;

  console.log(
    `The simple interest is $${simpleInterest} and the total cumulated after ${time} years is ${
      `$` + (principal + simpleInterest)
    }`
  );

  return principal + simpleInterest;
}
```

### Compound Interest

Create a helper function to calculate the compound interest:

```javascript
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

  return amount;
}
```


### Receive inputs, call the helper functions, and send notices.

A notice is an informational statement submitted to the Rollup Server as evidence of the off-chain computation.


Modify the handler function(`handle_advance`) to receive the inputs, call the helper functions, and send notices:

```javascript
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
```

## Build the application

With the Docker engine running, build the application using the Cartesi CLI by running:

```shell
cartesi build
```

This command builds a Cartesi machine and compiles your application so that it is ready to receive requests and inputs


## Run the application

Run the application using the Cartesi CLI by running:

```shell
cartesi run
```

Running your application starts a local Anvil node on port `8545`.

The `cartesi run` command activates several services essential for node operation:

- Anvil Chain: Runs a local blockchain available at http://localhost:8545.

- GraphQL Playground: An interactive IDE at http://localhost:8080/graphql for exploring the GraphQL server.

- Blockchain Explorer: Monitors node activity and manages transactions via http://localhost:8080/explorer/.

- Inspect: A diagnostic tool accessible at http://localhost:8080/inspect/ to inspect the node’s state.


## Interact with the application

Your application is now ready to receive inputs:

Send an input by running:

```shell
cartesi send generic 
```

The command sends an input to the application and triggers the off-chain computation. The output is then sent back to the Rollup Server as a notice.

```shell
sunodo send generic
? Chain Foundry
? RPC URL http://localhost:8545
? Wallet Mnemonic
? Mnemonic test test test test test test test test test test test junk
? Account 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 9999.963673731053434427 ETH
? Application address 0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e
? Input String encoding
? Input (as string) { "method": "compound", "principal": 2000, "rate": 5, "time": 3 , "compoundFrequency": "yearly" }
✔ Input sent: 0x8cba66f7a739962742dd404fcfb3d143f5aa953425e33de5513255589b69ad05
```

Here are input samples for both simple and compound interest:

```json
{"method": "simple","principal": 2000,"rate": 5,"time": 3}
```

```json
{"method": "compound","principal": 2000,"rate": 5,"time": 3,"compoundFrequency": "quarterly"}
```

## Query notices

In the GraphQL playground hosted on http://localhost:8080/graphql, you can query notices using the following query:

```graphql
query notices {
  notices {
    edges {
      node {
        index
        input {
          index
        }
        payload
      }
    }
  }
}
```

This query returns a list of notices with their respective payloads in hex. You can convert the hex to a string when building user interfaces.

## Conclusion

Voila! You have successfully built a simple interest rate calculator dApp on Cartesi. You can now build more complex applications using Cartesi's powerful off-chain computation capabilities.

The complete source code is available in the `src/index.js` file. Feel free to modify and experiment with it.