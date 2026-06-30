jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import apiClient from '../../services/apiClient';
import {
  getPayments,
  downloadArtisanReceipt,
  getArtisanPayoutHistory,
  getVatSummary,
  getAdminEarnings,
  releaseStage,
  markInvoicePaid,
} from '../../services/paymentsService';

// ─── getEscrowStatus logic (tested via getPayments) ──────────────────────────

describe('getPayments — escrowStatus mapping', () => {
  function makeOrder(overrides = {}) {
    return {
      id: 'o1', ref: 'ORD-ABC123',
      brand: { id: 'b1', businessName: 'Test Brand' },
      jobs: [],
      totalAmount: 100000,
      escrowBalance: 0,
      type: 'SAMPLE',
      status: 'FLAT_FEE_PAID',
      payments: [],
      invoice: null,
      snapshotAdminRate: null,
      snapshotStage1Rate: null,
      snapshotStage2Rate: null,
      snapshotSampleAdminRate: null,
      ...overrides,
    };
  }

  test('escrowStatus is "Released" when both stages released', async () => {
    const payments = [
      { stage: 'MATERIAL', status: 'RELEASED' },
      { stage: 'SERVICE', status: 'RELEASED' },
    ];
    apiClient.get.mockResolvedValue({ data: { data: [makeOrder({ payments })] } });
    const result = await getPayments();
    expect(result[0].escrowStatus).toBe('Released');
  });

  test('escrowStatus is "Partially Released" when only stage 1 released', async () => {
    const payments = [{ stage: 'MATERIAL', status: 'RELEASED' }];
    apiClient.get.mockResolvedValue({ data: { data: [makeOrder({ payments })] } });
    const result = await getPayments();
    expect(result[0].escrowStatus).toBe('Partially Released');
  });

  test('escrowStatus is "Held" when escrowBalance > 0 and nothing released', async () => {
    apiClient.get.mockResolvedValue({
      data: { data: [makeOrder({ escrowBalance: 50000, payments: [] })] },
    });
    const result = await getPayments();
    expect(result[0].escrowStatus).toBe('Held');
  });

  test('escrowStatus is "Pending" when no balance and nothing released', async () => {
    apiClient.get.mockResolvedValue({
      data: { data: [makeOrder({ escrowBalance: 0, payments: [] })] },
    });
    const result = await getPayments();
    expect(result[0].escrowStatus).toBe('Pending');
  });

  test('returns [] on API error', async () => {
    apiClient.get.mockRejectedValue(new Error('Network error'));
    const result = await getPayments();
    expect(result).toEqual([]);
  });
});

describe('getPayments — data mapping', () => {
  test('maps orderRef from ref field', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: [{
          id: 'o1', ref: 'ORD-XYZ',
          brand: { id: 'b1', businessName: 'Brand' },
          jobs: [{ artisan: { fullName: 'John', id: 'a1', bankDetail: null }, status: 'ASSIGNED' }],
          totalAmount: 50000, escrowBalance: 0,
          type: 'SAMPLE', status: 'FLAT_FEE_PAID',
          payments: [], invoice: null,
        }],
      },
    });
    const result = await getPayments();
    expect(result[0].orderRef).toBe('ORD-XYZ');
    expect(result[0].artisan).toBe('John');
    expect(result[0].fullAmount).toBe(50000);
  });

  test('handles sample/production split response shape', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: {
          sample: [{ id: 's1', ref: 'ORD-S1', brand: { id: 'b1', businessName: 'B' }, jobs: [], totalAmount: 0, escrowBalance: 0, type: 'SAMPLE', status: 'FLAT_FEE_PAID', payments: [], invoice: null }],
          production: [{ id: 'p1', ref: 'ORD-P1', brand: { id: 'b1', businessName: 'B' }, jobs: [], totalAmount: 0, escrowBalance: 0, type: 'PRODUCTION', status: 'IN_PRODUCTION', payments: [], invoice: null }],
        },
      },
    });
    const result = await getPayments();
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['s1', 'p1']);
  });
});

// ─── downloadArtisanReceipt ──────────────────────────────────────────────────

describe('downloadArtisanReceipt', () => {
  test('calls correct endpoint with blob responseType', async () => {
    const fakeBlob = new Blob(['pdf']);
    apiClient.get.mockResolvedValue({ data: fakeBlob });
    const result = await downloadArtisanReceipt('pay-123');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/admin/payments/pay-123/artisan-receipt',
      expect.objectContaining({ responseType: 'blob' })
    );
    expect(result).toBe(fakeBlob);
  });
});

// ─── releaseStage ────────────────────────────────────────────────────────────

describe('releaseStage', () => {
  test('calls stage1 endpoint for stage 1', async () => {
    apiClient.post.mockResolvedValue({ data: { success: true } });
    await releaseStage('o1', 1);
    expect(apiClient.post).toHaveBeenCalledWith('/admin/orders/o1/release-stage1', {});
  });

  test('calls stage2 endpoint for stage 2', async () => {
    apiClient.post.mockResolvedValue({ data: { success: true } });
    await releaseStage('o1', 2);
    expect(apiClient.post).toHaveBeenCalledWith('/admin/orders/o1/release-stage2', {});
  });
});

// ─── getArtisanPayoutHistory ─────────────────────────────────────────────────

describe('getArtisanPayoutHistory', () => {
  test('returns data array on success', async () => {
    const records = [{ id: 'pay-1', amount: 31500 }];
    apiClient.get.mockResolvedValue({ data: { data: records } });
    const result = await getArtisanPayoutHistory();
    expect(result).toEqual(records);
  });

  test('returns [] on error', async () => {
    apiClient.get.mockRejectedValue(new Error('fail'));
    const result = await getArtisanPayoutHistory();
    expect(result).toEqual([]);
  });
});

// ─── getAdminEarnings ────────────────────────────────────────────────────────

describe('getAdminEarnings', () => {
  test('returns default shape on error', async () => {
    apiClient.get.mockRejectedValue(new Error('fail'));
    const result = await getAdminEarnings();
    expect(result).toEqual(
      expect.objectContaining({ totalEarned: 0, totalWithdrawn: 0, outstanding: 0 })
    );
  });
});
