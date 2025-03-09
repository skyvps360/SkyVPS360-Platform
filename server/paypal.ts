// @ts-ignore
import paypal from "@paypal/checkout-server-sdk";

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const mode = process.env.PAYPAL_MODE || 'sandbox';

if (!clientId || !clientSecret) {
  throw new Error("PayPal credentials not found");
}

function environment() {
  // Use environment variable to determine mode
  if (mode === 'live') {
    console.log('Using PayPal Live Environment');
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    console.log('Using PayPal Sandbox Environment');
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

const client = new paypal.core.PayPalHttpClient(environment());

export async function createSubscription(amount: number, currency: string = "USD") {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount.toFixed(2),
      },
      description: `Add $${amount.toFixed(2)} to balance`,
    }],
  });

  try {
    const order = await client.execute(request);
    return order.result;
  } catch (err) {
    console.error("Error creating PayPal order:", err);
    throw err;
  }
}

export async function capturePayment(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    const payment = capture.result;
    const amount = parseInt(payment.purchase_units[0].payments.captures[0].amount.value) * 100; // Convert to cents
    return { payment, amount };
  } catch (err) {
    console.error("Error capturing PayPal payment:", err);
    throw new Error("Failed to capture payment");
  }
}

export async function getSubscriptionDetails(subscriptionId: string) {
  const request = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId);

  try {
    const subscription = await client.execute(request);
    return subscription.result;
  } catch (err) {
    console.error("Error getting subscription details:", err);
    throw new Error("Failed to get subscription details");
  }
}

// Export current mode for frontend reference
export const paypalMode = mode;

export const plans = {
  basic: {
    id: "BASIC_PLAN",
    name: "Basic Plan",
    description: "1 VPS Server, 5GB Storage",
    price: 10.00,
    limits: {
      maxServers: 1,
      maxStorageGB: 5,
    }
  },
  pro: {
    id: "PRO_PLAN",
    name: "Pro Plan", 
    description: "3 VPS Servers, 20GB Storage",
    price: 30.00,
    limits: {
      maxServers: 3,
      maxStorageGB: 20,
    }
  },
  enterprise: {
    id: "ENTERPRISE_PLAN",
    name: "Enterprise Plan",
    description: "10 VPS Servers, 100GB Storage",
    price: 100.00,
    limits: {
      maxServers: 10,
      maxStorageGB: 100,
    }
  },
};