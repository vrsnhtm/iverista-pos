-- Iverista POS — seed menu and ingredient list.
-- Costs are deliberately 0 / empty: the owner enters them.
-- Safe to run more than once (INSERT OR IGNORE on primary keys).

BEGIN;

INSERT OR IGNORE INTO ingredients (id, name, unit) VALUES
  ('coffee-bean',           'coffee bean',           'g'),
  ('fresh-milk',            'fresh milk',            'ml'),
  ('nestle-cream',          'Nestle cream',          'ml'),
  ('condensed-milk',        'condensed milk',        'ml'),
  ('evaporated-milk',       'evaporated milk',       'ml'),
  ('caramel-syrup',         'caramel syrup',         'ml'),
  ('vanilla-syrup',         'vanilla syrup',         'ml'),
  ('sugar-syrup',           'sugar syrup',           'ml'),
  ('white-chocolate-syrup', 'white chocolate syrup', 'ml'),
  ('cocoa-powder',          'cocoa powder',          'g'),
  ('iodized-salt',          'iodized salt',          'g'),
  ('fruit-syrup',           'fruit syrup',           'ml'),
  ('sprite',                'Sprite',                'ml'),
  ('tube-ice',              'tube ice',              'pc'),
  ('cup',                   'cup',                   'pc'),
  ('lid',                   'lid',                   'pc'),
  ('straw',                 'straw',                 'pc'),
  ('water',                 'water',                 'ml');

INSERT OR IGNORE INTO drinks (id, name, category, price_cents, active) VALUES
  ('coffee-americano',             'Americano',            'Coffee',     8000, 1),
  ('coffee-long-black',            'Long Black',           'Coffee',     8000, 1),
  ('coffee-sweet-black',           'Sweet Black',          'Coffee',     9000, 1),
  ('coffee-spanish-latte',         'Spanish Latte',        'Coffee',    10000, 1),
  ('coffee-mocha',                 'Mocha',                'Coffee',    11000, 1),
  ('coffee-caramel-macchiato',     'Caramel Macchiato',    'Coffee',    11000, 1),
  ('coffee-salted-caramel',        'Salted Caramel',       'Coffee',    11000, 1),
  ('coffee-french-vanilla',        'French Vanilla',       'Coffee',    11000, 1),
  ('coffee-sea-salt-latte',        'Sea Salt Latte',       'Coffee',    11000, 1),
  ('coffee-white-chocolate-mocha', 'White Chocolate Mocha','Coffee',    11000, 1),
  ('coffee-vietnamese-coffee',     'Vietnamese Coffee',    'Coffee',        0, 0),
  ('soda-blueberry',               'Blueberry',            'Soda',       6000, 1),
  ('soda-strawberry',              'Strawberry',           'Soda',       6000, 1),
  ('soda-green-apple',             'Green Apple',          'Soda',       6000, 1),
  ('soda-lychee',                  'Lychee',               'Soda',       6000, 1),
  ('non-coffee-ice-chocolate',     'Ice Chocolate',        'Non-coffee',    0, 0),
  ('non-coffee-matcha-latte',      'Matcha Latte',         'Non-coffee',    0, 0),
  ('non-coffee-strawberry-latte',  'Strawberry Latte',     'Non-coffee',    0, 0),
  ('non-coffee-blueberry-latte',   'Blueberry Latte',      'Non-coffee',    0, 0),
  ('non-coffee-green-apple-latte', 'Green Apple Latte',    'Non-coffee',    0, 0),
  ('fruit-blueberry',              'Blueberry',            'Fruit',         0, 0),
  ('fruit-strawberry',             'Strawberry',           'Fruit',         0, 0),
  ('fruit-green-apple',            'Green Apple',          'Fruit',         0, 0),
  ('fruit-lychee',                 'Lychee',               'Fruit',         0, 0),
  ('add-ons-espresso-shot',        'Espresso Shot',        'Add-ons',    3000, 1),
  ('add-ons-french-vanilla-syrup', 'French Vanilla Syrup', 'Add-ons',    2000, 1),
  ('add-ons-caramel-syrup',        'Caramel Syrup',        'Add-ons',    2000, 1),
  ('add-ons-white-chocolate-syrup','White Chocolate Syrup','Add-ons',    2000, 1),
  ('add-ons-salted-caramel-syrup', 'Salted Caramel Syrup', 'Add-ons',    2000, 1),
  ('add-ons-sea-salt-foam',        'Sea Salt Foam',        'Add-ons',    2000, 1);

COMMIT;
