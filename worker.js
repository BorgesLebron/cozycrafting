// ============================================
// Cozy Crafting — Stripe Checkout Worker
//
// Deploy this as a Cloudflare Worker bound to the
// route: cozycrafting.us/api/checkout
//
// Required Worker secret (set via `wrangler secret put`
// or the Cloudflare dashboard → Settings → Variables):
//   STRIPE_SECRET_KEY   (starts with sk_test_ or sk_live_)
//
// SECURITY NOTE: prices live here, NOT in the request
// body. The browser only ever sends product ids and
// quantities — this file is the single source of truth
// for what things cost, so nobody can tamper with prices
// via devtools/network requests.
// ============================================

const PRODUCTS = {
  "wonder-box": {
    name: "Fifi-Lu Wonder Box",
    price: 2899, // cents
  },
  "tote-bag": {
    name: "Fifi-Lu Natural Cotton Tote Bag",
    price: 1500, // cents
  },
  "coloring-book": {
    name: "Fifi-Lu Cozy Wonders Coloring Book",
    price: 1299,
  },
  "page-protector": {
    name: "Page Protector & Decorative Paper Clip",
    price: 800,
  },
};

const SITE_URL = "https://cozycrafting.us";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin && origin.endsWith("cozycrafting.us") ? origin : SITE_URL,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    if (!env.STRIPE_SECRET_KEY) {
      return json({ error: "Server is not configured for payments yet." }, 500, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body" }, 400, origin);
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) {
      return json({ error: "Cart is empty" }, 400, origin);
    }

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${SITE_URL}/shop.html`);
    params.append("shipping_address_collection[allowed_countries][]", "US");
    params.append("shipping_address_collection[allowed_countries][]", "PR");

    let lineIndex = 0;
    for (const item of items) {
      const product = PRODUCTS[item.id];
      if (!product) continue; // ignore unknown ids rather than trusting client data

      const qty = Math.max(1, Math.min(20, parseInt(item.qty, 10) || 1));

      params.append(`line_items[${lineIndex}][quantity]`, String(qty));
      params.append(`line_items[${lineIndex}][price_data][currency]`, "usd");
      params.append(`line_items[${lineIndex}][price_data][unit_amount]`, String(product.price));
      params.append(`line_items[${lineIndex}][price_data][product_data][name]`, product.name);
      lineIndex++;
    }

    if (lineIndex === 0) {
      return json({ error: "No valid items in cart" }, 400, origin);
    }

    let stripeRes;
    try {
      stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });
    } catch {
      return json({ error: "Could not reach Stripe" }, 502, origin);
    }

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return json({ error: (session.error && session.error.message) || "Stripe error" }, 500, origin);
    }

    return json({ url: session.url }, 200, origin);
  },
};
