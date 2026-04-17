import { commissionSettings } from '@/data/mockData';

let settingsStore = { ...commissionSettings };

export async function getCommissionSettings() {
  return { ...settingsStore };
}

export async function updateCommissionSettings(payload) {
  settingsStore = {
    ...settingsStore,
    ...payload,
  };
  return { ...settingsStore };
}

export function calculateCommissionBreakdown(fullAmount, type, settings = settingsStore) {
  const amount = Number(fullAmount || 0);

  if (type === 'Sample') {
    const adminCommission = Math.round((settings.sampleAdminCommissionPercent / 100) * settings.sampleFlatFee);
    const artisanStage1 = 0;
    const artisanStage2 = Math.max(settings.sampleFlatFee - adminCommission, 0);

    return {
      fullAmount: settings.sampleFlatFee,
      adminPercent: settings.sampleAdminCommissionPercent,
      stage1Percent: 0,
      stage2Percent: 100 - settings.sampleAdminCommissionPercent,
      adminCommission,
      artisanStage1,
      artisanStage2,
    };
  }

  const adminCommission = Math.round((settings.adminCommissionPercent / 100) * amount);
  const artisanStage1 = Math.round((settings.artisanStage1Percent / 100) * amount);
  const artisanStage2 = Math.round((settings.artisanStage2Percent / 100) * amount);

  return {
    fullAmount: amount,
    adminPercent: settings.adminCommissionPercent,
    stage1Percent: settings.artisanStage1Percent,
    stage2Percent: settings.artisanStage2Percent,
    adminCommission,
    artisanStage1,
    artisanStage2,
  };
}
