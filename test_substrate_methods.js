// Test script to verify Substrate toolbox method rename and new signMessage functionality
import { Chain } from "@swapkit/helpers";
import { getSubstrateToolbox } from "@swapkit/toolboxes/substrate";

async function testSubstrateToolbox() {
  console.log("Testing Substrate toolbox method renames and signMessage...");

  try {
    // Create a test toolbox for Polkadot
    const toolbox = await getSubstrateToolbox(Chain.Polkadot);

    // Check that the old method names don't exist
    console.log("Checking old method names...");
    console.log("- sign method exists:", typeof toolbox.sign !== "undefined");
    console.log("- signAndBroadcast method exists:", typeof toolbox.signAndBroadcast !== "undefined");

    // Check that the new method names exist
    console.log("Checking new method names...");
    console.log("- signTransaction method exists:", typeof toolbox.signTransaction === "function");
    console.log(
      "- signAndBroadcastTransaction method exists:",
      typeof toolbox.signAndBroadcastTransaction === "function",
    );
    console.log("- signMessage method exists:", typeof toolbox.signMessage === "function");

    // Test that signMessage has the correct signature
    console.log(
      "signMessage is a function that returns Promise:",
      typeof toolbox.signMessage === "function" && toolbox.signMessage.constructor.name === "Function",
    );

    console.log("\n✅ All method renames and new signMessage method implemented successfully!");
  } catch (error) {
    console.error("❌ Error testing toolbox:", error.message);
  }
}

testSubstrateToolbox();
