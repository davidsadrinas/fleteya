import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushTokenProvider {
  getToken(): Promise<string>;
}

const expoPushTokenProvider: PushTokenProvider = {
  async getToken() {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  },
};

export async function registerForPushNotificationsAsync(
  tokenProvider: PushTokenProvider = expoPushTokenProvider
): Promise<string | null> {
  if (!Device.isDevice) return null;

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;
  if (finalStatus !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    finalStatus = asked.status;
  }
  if (finalStatus !== "granted") return null;

  return tokenProvider.getToken();
}
