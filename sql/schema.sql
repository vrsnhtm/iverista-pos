-- Iverista POS — database schema
-- SQLite dialect (also valid on Cloudflare D1). Money is integer centavos;
-- quantities are ingredient units (g, ml, pc).
--
-- The app currently persists to localStorage (src/lib/storage.ts). This schema
-- is the target when that wrapper is replaced by a real database.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- ingredients
CREATE TABLE ingredients (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL UNIQUE,
  unit                TEXT NOT NULL,
  purchase_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (purchase_cost_cents >= 0),
  purchase_qty        NUMERIC NOT NULL DEFAULT 0 CHECK (purchase_qty >= 0),
  on_hand             NUMERIC NOT NULL DEFAULT 0,
  reorder_level       NUMERIC NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ---------------------------------------------------------------------- menu
CREATE TABLE drinks (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('Coffee', 'Soda', 'Non-coffee', 'Fruit')),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (category, name)
);

-- One recipe line per row: either an ingredient usage or a free-text amount.
CREATE TABLE cost_lines (
  id             TEXT PRIMARY KEY,
  drink_id       TEXT NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL CHECK (kind IN ('ingredient', 'custom')),
  ingredient_id  TEXT REFERENCES ingredients(id),
  qty            NUMERIC CHECK (qty IS NULL OR qty > 0),
  custom_name    TEXT,
  amount_cents   INTEGER CHECK (amount_cents IS NULL OR amount_cents >= 0),
  CHECK (
    (kind = 'ingredient'
      AND ingredient_id IS NOT NULL
      AND qty IS NOT NULL
      AND custom_name IS NULL
      AND amount_cents IS NULL)
    OR
    (kind = 'custom'
      AND ingredient_id IS NULL
      AND qty IS NULL
      AND custom_name IS NOT NULL
      AND amount_cents IS NOT NULL)
  )
);

CREATE INDEX idx_cost_lines_drink ON cost_lines (drink_id);

-- -------------------------------------------------------------------- orders
CREATE TABLE orders (
  id               TEXT PRIMARY KEY,
  business_date    TEXT NOT NULL,              -- local YYYY-MM-DD
  order_number     INTEGER NOT NULL,           -- resets each business_date, starts at 1
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  type             TEXT NOT NULL CHECK (type IN ('dine-in', 'takeaway')),
  payment          TEXT NOT NULL CHECK (payment IN ('cash', 'gcash')),
  tendered_cents   INTEGER CHECK (tendered_cents IS NULL OR tendered_cents >= 0),
  change_cents     INTEGER CHECK (change_cents IS NULL OR change_cents >= 0),
  gcash_ref        TEXT,
  subtotal_cents   INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  total_cents      INTEGER NOT NULL CHECK (total_cents >= 0),
  total_cost_cents INTEGER NOT NULL CHECK (total_cost_cents >= 0),
  profit_cents     INTEGER NOT NULL,
  cost_missing     INTEGER NOT NULL DEFAULT 0 CHECK (cost_missing IN (0, 1)),
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new', 'preparing', 'ready', 'done')),
  voided           INTEGER NOT NULL DEFAULT 0 CHECK (voided IN (0, 1)),
  voided_at        TEXT,
  UNIQUE (business_date, order_number),
  CHECK (payment <> 'gcash' OR (gcash_ref IS NOT NULL AND length(trim(gcash_ref)) > 0))
);

CREATE INDEX idx_orders_business_date ON orders (business_date, order_number);
CREATE INDEX idx_orders_open ON orders (status) WHERE voided = 0;

-- Frozen sale lines: price, cost and profit are snapshots taken at sale time.
CREATE TABLE order_items (
  id               INTEGER PRIMARY KEY,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  line_no          INTEGER NOT NULL,
  drink_id         TEXT REFERENCES drinks(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  qty              INTEGER NOT NULL CHECK (qty > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  unit_cost_cents  INTEGER NOT NULL CHECK (unit_cost_cents >= 0),
  line_sales_cents INTEGER NOT NULL,
  line_cost_cents  INTEGER NOT NULL,
  line_profit_cents INTEGER NOT NULL,
  cost_missing     INTEGER NOT NULL DEFAULT 0 CHECK (cost_missing IN (0, 1)),
  UNIQUE (order_id, line_no)
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- Ingredient usage captured with the sale, so a void restores the right stock
-- even after the recipe changes.
CREATE TABLE order_item_ingredient_use (
  order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  qty           NUMERIC NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_item_id, ingredient_id)
);

-- --------------------------------------------------------------------- views
-- Cost per cup: each line is rounded once, custom lines count at face value.
CREATE VIEW drink_costs AS
SELECT
  d.id,
  d.name,
  d.category,
  d.price_cents,
  d.active,
  COALESCE(c.cost_cents, 0) AS cost_cents,
  d.price_cents - COALESCE(c.cost_cents, 0) AS profit_cents,
  CASE
    WHEN d.price_cents > 0
      THEN ROUND((d.price_cents - COALESCE(c.cost_cents, 0)) * 100.0 / d.price_cents, 2)
  END AS margin_pct,
  CASE WHEN d.price_cents <= 0 THEN 1 ELSE 0 END AS needs_price,
  CASE WHEN COALESCE(c.line_count, 0) = 0 THEN 1 ELSE 0 END AS needs_cost
FROM drinks d
LEFT JOIN (
  SELECT
    cl.drink_id,
    SUM(
      CAST(
        ROUND(
          CASE
            WHEN cl.kind = 'ingredient'
              THEN cl.qty * (i.purchase_cost_cents * 1.0 / NULLIF(i.purchase_qty, 0))
            ELSE cl.amount_cents
          END
        ) AS INTEGER
      )
    ) AS cost_cents,
    COUNT(cl.id) AS line_count
  FROM cost_lines cl
  LEFT JOIN ingredients i ON i.id = cl.ingredient_id
  GROUP BY cl.drink_id
) c ON c.drink_id = d.id;

-- Voided orders are excluded from every figure.
CREATE VIEW daily_sales AS
SELECT
  business_date,
  COUNT(*) AS order_count,
  SUM(total_cents) AS sales_cents,
  SUM(total_cost_cents) AS cost_cents,
  SUM(profit_cents) AS profit_cents,
  SUM(cost_missing) AS cost_missing_orders
FROM orders
WHERE voided = 0
GROUP BY business_date;
