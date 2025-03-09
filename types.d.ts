declare module '@paypal/checkout-server-sdk' {
  namespace core {
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    class PayPalHttpClient {
      constructor(environment: LiveEnvironment | SandboxEnvironment);
      execute<T>(request: any): Promise<{ result: T }>;
    }
  }

  namespace orders {
    class OrdersCreateRequest {
      prefer(preference: string): void;
      requestBody(body: any): void;
    }
    class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: any): void;
    }
  }

  namespace subscriptions {
    class SubscriptionsGetRequest {
      constructor(subscriptionId: string);
    }
  }
}