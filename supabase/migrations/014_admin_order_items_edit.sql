-- Admin Order Items Edit Policies
-- Allows admins to INSERT, UPDATE, DELETE order_items for order editing

CREATE POLICY "Admins can insert order items"
  ON order_items FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete order items"
  ON order_items FOR DELETE TO authenticated
  USING (is_admin());
