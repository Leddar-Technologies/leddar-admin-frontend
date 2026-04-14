import { payments } from '@/data/mockData';

let paymentStore = payments.map((item) => ({ ...item }));

export async function getPayments() {
  return paymentStore.map((item) => ({ ...item }));
}

export async function markInvoicePaid(paymentId) {
  paymentStore = paymentStore.map((payment) =>
    payment.id === paymentId
      ? {
          ...payment,
          invoiceStatus: 'Paid',
        }
      : payment
  );

  return paymentStore.find((payment) => payment.id === paymentId) || null;
}

export async function releaseStage(paymentId, stage) {
  paymentStore = paymentStore.map((payment) => {
    if (payment.id !== paymentId) return payment;

    const updated = {
      ...payment,
      stage1Released: stage === 1 ? true : payment.stage1Released,
      stage2Released: stage === 2 ? true : payment.stage2Released,
    };

    if (updated.stage1Released && updated.stage2Released) {
      updated.escrowStatus = 'Released';
    } else if (updated.stage1Released || updated.stage2Released) {
      updated.escrowStatus = 'Partially Released';
    }

    return updated;
  });

  return paymentStore.find((payment) => payment.id === paymentId) || null;
}
