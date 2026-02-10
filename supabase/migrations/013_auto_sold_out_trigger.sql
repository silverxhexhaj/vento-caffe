-- Auto-update sold_out status when stock_quantity changes

CREATE OR REPLACE FUNCTION update_sold_out_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET sold_out = (NEW.stock_quantity = 0)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sold_out
  AFTER UPDATE OF stock_quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_sold_out_status();
