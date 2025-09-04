// Simple verification test for the new Ripple methods
const { getRippleToolbox } = require('./packages/toolboxes/dist/ripple');

async function testRippleToolbox() {
  try {
    // Create toolbox with a test phrase
    const phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const rippleWallet = await getRippleToolbox({ phrase });

    console.log('✅ getRippleToolbox created successfully');
    
    // Check if the new methods exist
    console.log('signAndBroadcastTransaction exists:', typeof rippleWallet.signAndBroadcastTransaction === 'function');
    console.log('signMessage exists:', typeof rippleWallet.signMessage === 'function');
    
    // Test getting address
    const address = await rippleWallet.getAddress();
    console.log('Address:', address);
    
    // Test signing a simple message
    const message = "Hello SwapKit!";
    const signature = await rippleWallet.signMessage(message);
    console.log('Message signature:', signature);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRippleToolbox();