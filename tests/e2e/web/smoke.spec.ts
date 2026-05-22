// Smoke tests covering all six pages of the dynamic UI.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5174";

test("workbench shows all four Yamanaka factors", async ({ page }) => {
  await page.goto(`${BASE}/?transport=wasm#/workbench`);
  await expect(page.locator(".hero-title", { hasText: /Yamanaka Factor Workbench/i })).toBeVisible();
  for (const f of ["OCT4", "SOX2", "KLF4", "CMYC"]) {
    await expect(page.locator(".factor-badge", { hasText: f })).toBeVisible();
  }
});

test("evolve cycle produces mutation diff + hotspots", async ({ page }) => {
  await page.goto(`${BASE}/?transport=wasm#/evolve`);
  await page.getByRole("button", { name: /Launch Cycle/i }).click();
  await expect(page.locator(".aa-mut").first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("heading", { name: "Mutation Hotspots" })).toBeVisible();
});

test("evolve page renders live event stream", async ({ page }) => {
  await page.goto(`${BASE}/?transport=wasm#/evolve`);
  await expect(page.getByRole("heading", { name: "Live Event Stream" })).toBeVisible();
  await expect(page.locator(".stream-row").first()).toBeVisible({ timeout: 5_000 });
});

test("embedding page projects + finds neighbours", async ({ page }) => {
  await page.goto(`${BASE}/?transport=wasm#/embedding`);
  await expect(page.getByRole("heading", { name: /3D Embedding Space/i })).toBeVisible();
  await expect(page.locator(".three-host canvas").first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("heading", { name: /Nearest Neighbours/i })).toBeVisible();
});

test("quantum page runs VQE and shows convergence", async ({ page }) => {
  await page.goto(`${BASE}/?transport=wasm#/quantum`);
  await expect(page.getByRole("heading", { name: "Hamiltonian Editor" })).toBeVisible();
  await page.getByRole("button", { name: "Run VQE" }).click();
  await expect(page.locator(".timeline polyline").first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("heading", { name: "VQE Convergence" })).toBeVisible();
});

test("lineage shows witness chain with TEE badges", async ({ page }) => {
  await page.goto(`${BASE}/?transport=wasm#/lineage`);
  await expect(page.getByRole("heading", { name: /Witness Chain/i })).toBeVisible();
  await expect(page.locator(".chain-node").first()).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".tee-badge").first()).toBeVisible();
});

test("governance shows policies + audit + segment explorer", async ({ page }) => {
  await page.goto(`${BASE}/?transport=wasm#/governance`);
  await expect(page.getByRole("heading", { name: /Governance Policies/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Audit Trail" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "RVF Segment Explorer" })).toBeVisible();
  await expect(page.locator(".segment").first()).toBeVisible({ timeout: 5_000 });
});

test("six-tab router switches without reload", async ({ page }) => {
  await page.goto(`${BASE}/?transport=wasm#/workbench`);
  for (const tab of ["evolve", "embedding", "quantum", "lineage", "governance", "workbench"]) {
    await page.locator(`.tab .tab-label`, { hasText: new RegExp(`^${tab}$`, "i") }).click();
    await expect(page).toHaveURL(new RegExp(`#/${tab}$`));
  }
});

test("transport badges still render for http and rvf", async ({ page }) => {
  await page.goto(`${BASE}/?transport=http#/workbench`);
  await expect(page.locator(".badge.mode-http")).toBeVisible();
  await page.goto(`${BASE}/?transport=rvf#/governance`);
  await expect(page.locator(".badge.mode-rvf")).toBeVisible();
});
