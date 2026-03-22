import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Vento Caffè <orders@ventocaffe.al>";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  isFree: boolean;
}

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

function formatLeke(amount: number): string {
  return `${amount.toLocaleString("sq-AL")} Lekë`;
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  isSubscription: boolean;
  shippingAddress: ShippingAddress;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { to, orderId, items, total, isSubscription, shippingAddress } = params;
  const shortId = orderId.slice(0, 8).toUpperCase();

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.name} &times; ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${
            item.isFree ? "FREE" : formatLeke(item.price * item.quantity)
          }</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-size:20px;margin-bottom:4px;">Order Confirmed</h1>
      <p style="color:#6b6b6b;font-size:14px;margin-top:0;">Order #${shortId}</p>

      <p style="font-size:14px;line-height:1.6;">
        Thank you for your order! We are preparing it and will have it on its way soon.
        ${isSubscription ? "<br/><strong>This is a monthly subscription order.</strong>" : ""}
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:24px 0;">
        <thead>
          <tr style="border-bottom:2px solid #1a1a1a;">
            <th style="text-align:left;padding:8px 0;">Item</th>
            <th style="text-align:right;padding:8px 0;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td style="padding:12px 0;font-weight:bold;">Total</td>
            <td style="padding:12px 0;font-weight:bold;text-align:right;">${formatLeke(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#f5f5f5;padding:16px;border-radius:8px;font-size:13px;margin:24px 0;">
        <p style="margin:0 0 4px;font-weight:600;">Shipping to:</p>
        <p style="margin:0;color:#6b6b6b;">
          ${shippingAddress.fullName}<br/>
          ${shippingAddress.address}<br/>
          ${shippingAddress.city}${shippingAddress.postalCode ? `, ${shippingAddress.postalCode}` : ""}<br/>
          ${shippingAddress.country}
        </p>
      </div>

      <p style="font-size:13px;color:#6b6b6b;">
        Questions? Reply to this email or message us on
        <a href="https://wa.me/355689188161" style="color:#1a1a1a;">WhatsApp</a>.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#999;">Vento Caffè &middot; Premium Coffee Cialde Delivered Monthly</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Order Confirmed — #${shortId}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}

export async function sendOrderStatusUpdateEmail(params: {
  to: string;
  orderId: string;
  newStatus: string;
  total: number;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { to, orderId, newStatus, total } = params;
  const shortId = orderId.slice(0, 8).toUpperCase();

  const statusLabels: Record<string, string> = {
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is being processed and will ship soon.",
    shipped: "Your order has been shipped! It should arrive within 2-3 business days.",
    delivered: "Your order has been delivered. Enjoy your espresso!",
    cancelled: "Your order has been cancelled. If you have questions, please contact us.",
  };

  const statusLabel = statusLabels[newStatus] || newStatus;
  const statusMessage = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}.`;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-size:20px;margin-bottom:4px;">Order Update</h1>
      <p style="color:#6b6b6b;font-size:14px;margin-top:0;">Order #${shortId}</p>

      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:24px 0;">
        <p style="margin:0 0 4px;font-size:13px;color:#6b6b6b;">Status</p>
        <p style="margin:0;font-size:16px;font-weight:600;">${statusLabel}</p>
      </div>

      <p style="font-size:14px;line-height:1.6;">${statusMessage}</p>

      <p style="font-size:14px;color:#6b6b6b;">Order total: <strong style="color:#1a1a1a;">${formatLeke(total)}</strong></p>

      <p style="font-size:13px;color:#6b6b6b;margin-top:24px;">
        Questions? Reply to this email or message us on
        <a href="https://wa.me/355689188161" style="color:#1a1a1a;">WhatsApp</a>.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#999;">Vento Caffè &middot; Premium Coffee Cialde Delivered Monthly</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Order #${shortId} — ${statusLabel}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send order status update email:", error);
  }
}
