
export async function pushNotification({
  appId,
  userId,
  message,
}: {
  appId: string
  userId: string
  message: string
}) {
  // TODO: call real DGA notification API
  return true
}
