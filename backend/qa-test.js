// QA Integration Tests for Product Approval Flow + JWT + Session
const BASE = "http://localhost:4000/api";

let accessToken = "";
let productId = "";
let categoryId = "";

async function request(method, path, body, token) {
  const opts = { method, headers: {} };
  if (body) { opts.body = JSON.stringify(body); opts.headers["Content-Type"] = "application/json"; }
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, opts);
      const data = res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
      if (res.status !== 429) return { status: res.status, data, ok: res.ok };
      if (i < 2) await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      if (i < 2) await new Promise(r => setTimeout(r, 2000));
      else throw e;
    }
  }
  return { status: 429, data: "Rate limited after retries", ok: false };
}

async function main() {
  let passed = 0, failed = 0;
  function assert(condition, label) {
    if (condition) { console.log(`  ✅ ${label}`); passed++; }
    else { console.log(`  ❌ ${label}`); failed++; }
  }

  // 1. Backend health
  console.log("\n📋 1. BACKEND HEALTH CHECK");
  const health = await request("GET", "/products");
  assert(Array.isArray(health.data), "GET /products returns array");

  // 2. Get categories
  console.log("\n📋 2. GET CATEGORIES");
  const cats = await request("GET", "/categories");
  assert(cats.ok, "GET /categories succeeds");
  if (cats.ok && cats.data.length > 0) {
    categoryId = cats.data[0].id;
    console.log(`  ℹ️  Using: ${cats.data[0].name} (${categoryId})`);
  }

  // 3. Login as admin
  console.log("\n📋 3. ADMIN LOGIN");
  const adminLogin = await request("POST", "/auth/login", {
    credential: "admin@lotifyx.com", contrasena: "Admin2026!",
  });
  assert(adminLogin.ok, "Admin login succeeds");
  if (adminLogin.ok) {
    accessToken = adminLogin.data.accessToken;
    assert(!!accessToken, "Admin token received");
  }

  // 4. Create a product as admin (admin is also a seller for testing)
  console.log("\n📋 4. CREATE PRODUCT (should be pending_approval)");
  if (categoryId && accessToken) {
    const prod = await request("POST", "/products", {
      category_id: categoryId,
      title: "QA Test Product",
      specifications: { "Título del Producto": "QA Test", "Precio Unitario": "99.99" },
      metodo_pago: "plataforma",
    }, accessToken);
    assert(prod.ok, "POST /products succeeds");
    if (prod.ok) {
      productId = prod.data.id;
      assert(prod.data.status === "pending_approval", `Status is "pending_approval" (got "${prod.data.status}")`);
    }
  } else {
    console.log("  ⏭️  Skipped (no category or token)");
  }

  // 5. Public GET /products should NOT include pending product
  console.log("\n📋 5. PUBLIC GET /products (should NOT return pending)");
  if (productId) {
    const pub = await request("GET", "/products");
    assert(pub.ok, "Public GET /products succeeds");
    const found = pub.data.find(p => p.id === productId);
    assert(!found, `Pending product is NOT in public listing (found=${!!found})`);
  }

  // 6. Admin list pending products
  console.log("\n📋 6. ADMIN LIST PENDING PRODUCTS");
  if (accessToken) {
    const pending = await request("GET", "/admin/products?status=pending_approval", null, accessToken);
    assert(pending.ok, "Admin GET /admin/products succeeds");
    const found = pending.data.find(p => p.id === productId);
    assert(found, `Pending product visible in admin panel (found=${!!found})`);
  }

  // 7. Admin approve product
  console.log("\n📋 7. ADMIN APPROVE PRODUCT");
  if (productId && accessToken) {
    const appr = await request("PATCH", `/admin/products/${productId}/approve`, null, accessToken);
    assert(appr.ok, "Admin approves product");
    if (appr.ok) assert(appr.data.status === "active", `Status → "active" (got "${appr.data.status}")`);
  }

  // 8. Public GET /products should now include approved product
  console.log("\n📋 8. PUBLIC GET /products (should include approved)");
  if (productId) {
    const pub = await request("GET", "/products");
    const found = pub.data.find(p => p.id === productId);
    assert(found, `Approved product IS in public listing (found=${!!found})`);
  }

  // 9. Filter by category
  console.log("\n📋 9. FILTER BY CATEGORY");
  if (categoryId) {
    const filtered = await request("GET", `/products?category_id=${categoryId}`);
    assert(filtered.ok, "GET /products?category_id= succeeds");
    const allMatch = filtered.data.every(p => p.category_id === categoryId);
    assert(allMatch, `All returned match category_id (correct=${allMatch})`);
  }

  // 10. Admin reject product (re-approve first, then reject)
  console.log("\n📋 10. ADMIN REJECT PRODUCT");
  if (productId && accessToken) {
    const rej = await request("PATCH", `/admin/products/${productId}/reject`, null, accessToken);
    assert(rej.ok, "Admin rejects product");
    if (rej.ok) assert(rej.data.status === "rejected", `Status → "rejected" (got "${rej.data.status}")`);
  }

  // 11. Rejected should NOT be in public listing
  console.log("\n📋 11. REJECTED NOT IN PUBLIC LISTING");
  if (productId) {
    const pub = await request("GET", "/products");
    const found = pub.data.find(p => p.id === productId);
    assert(!found, `Rejected product NOT in public listing (found=${!!found})`);
  }

  // ─── Summary ───
  console.log(`\n${"=".repeat(50)}`);
  console.log(`QA RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${"=".repeat(50)}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
