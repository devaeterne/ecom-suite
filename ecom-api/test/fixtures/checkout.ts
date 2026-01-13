// test/fixtures/checkout.ts
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

type SeedCheckoutOpts = {
  storeCookie: string;
  variantId: string;
  quantity?: number;

  startPayment?: boolean;
  paymentProviderKey?: string;
};

export async function seedCheckout(
  app: INestApplication,
  opts: SeedCheckoutOpts
): Promise<{ cartId: string; checkoutId: string }> {
  const server = app.getHttpServer();
  const quantity = opts.quantity ?? 1;

  const cartRes = await request(server)
    .post("/api/store/cart")
    .set("Cookie", opts.storeCookie)
    .send({});

  if (![200, 201].includes(cartRes.status)) {
    throw new Error(
      `[checkout.seedCheckout] cart create failed: ${
        cartRes.status
      } ${JSON.stringify(cartRes.body)}`
    );
  }

  const cartId = cartRes.body?.id ?? cartRes.body?.cart?.id;
  if (!cartId) {
    throw new Error(
      `[checkout.seedCheckout] cannot parse cartId: ${JSON.stringify(
        cartRes.body
      )}`
    );
  }

  const liRes = await request(server)
    .post(`/api/store/cart/${cartId}/line-items`)
    .set("Cookie", opts.storeCookie)
    .send({ variantId: opts.variantId, quantity });

  if (![200, 201].includes(liRes.status)) {
    throw new Error(
      `[checkout.seedCheckout] add line item failed: ${
        liRes.status
      } ${JSON.stringify(liRes.body)}`
    );
  }

  const checkoutRes = await request(server)
    .post("/api/store/checkout")
    .set("Cookie", opts.storeCookie)
    .send({ cartId });

  if (![200, 201].includes(checkoutRes.status)) {
    throw new Error(
      `[checkout.seedCheckout] checkout create failed: ${
        checkoutRes.status
      } ${JSON.stringify(checkoutRes.body)}`
    );
  }

  const checkoutId = checkoutRes.body?.id ?? checkoutRes.body?.checkout?.id;
  if (!checkoutId) {
    throw new Error(
      `[checkout.seedCheckout] cannot parse checkoutId: ${JSON.stringify(
        checkoutRes.body
      )}`
    );
  }

  if (opts.startPayment) {
    const spRes = await request(server)
      .post(`/api/store/checkout/${checkoutId}/start-payment`)
      .set("Cookie", opts.storeCookie)
      .send(
        opts.paymentProviderKey ? { providerKey: opts.paymentProviderKey } : {}
      );

    if (![200, 201].includes(spRes.status)) {
      throw new Error(
        `[checkout.seedCheckout] start-payment failed: ${
          spRes.status
        } ${JSON.stringify(spRes.body)}`
      );
    }
  }

  return { cartId, checkoutId };
}
