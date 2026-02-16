-- Set contents_key for the Didiesse espresso machine product
-- This enables the short marketing text on the product card
UPDATE products
SET contents_key = 'products.espressoMachine.contents'
WHERE slug = 'espresso-machine';
