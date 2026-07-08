import { useNotificationStore } from "../../platform/notification"

/**
 * Create a convenience order notification and push to the in-memory store.
 * Each end subscribes to `useNotificationStore` independently.
 */
export function notifyConvenience(
  orderId: string,
  serviceType: string,
  title: string,
  summary: string,
  targetUrl: string
) {
  useNotificationStore.getState().addNotification({
    type: "order",
    title,
    summary,
    targetUrl,
  })
}