import { notifications } from '@/data/mockData';

let notificationStore = notifications.map((item) => ({ ...item }));

export async function getNotifications() {
  return notificationStore.map((item) => ({ ...item }));
}

export async function createNotification(payload) {
  const newNotification = {
    id: Date.now(),
    ...payload,
  };
  notificationStore = [newNotification, ...notificationStore];
  return { ...newNotification };
}
