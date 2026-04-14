import { orderTimelines, orders } from '@/data/mockData';

let orderStore = orders.map((item) => ({ ...item }));
let timelineStore = Object.entries(orderTimelines).reduce((acc, [orderId, timeline]) => {
  acc[orderId] = timeline.map((entry) => ({ ...entry }));
  return acc;
}, {});

const samplePipeline = [
  'Flat Fee Paid',
  'Sample in Production',
  'Video Sent',
  'Sample Approved',
  'Balance Paid',
  'In Full Production',
  'Shipped',
  'Delivered',
];

const productionPipeline = ['Quote Approved', 'In Production', 'Shipped', 'Delivered'];

export async function getOrders() {
  return orderStore.map((item) => ({ ...item }));
}

export async function getOrderById(id) {
  return orderStore.find((item) => item.id === id) || null;
}

export async function getNextStatuses(orderId) {
  const order = await getOrderById(orderId);
  if (!order) return [];

  const pipeline = order.orderType === 'Sample' ? samplePipeline : productionPipeline;
  const currentIndex = pipeline.findIndex((status) => status === order.status);

  if (currentIndex === -1) return pipeline;
  return pipeline.slice(currentIndex + 1, currentIndex + 2);
}

export async function updateOrderStatus({ orderId, nextStatus, note }) {
  orderStore = orderStore.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status: nextStatus,
        }
      : order
  );

  const existing = timelineStore[orderId] || [];
  timelineStore[orderId] = [
    ...existing,
    {
      status: nextStatus,
      note: note || 'Status updated by admin.',
      at: new Date().toISOString(),
    },
  ];

  return getOrderById(orderId);
}

export async function getOrderTimeline(orderId) {
  return (timelineStore[orderId] || []).map((item) => ({ ...item }));
}
