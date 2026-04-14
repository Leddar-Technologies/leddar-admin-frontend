import { artisans } from '@/data/mockData';

let artisanStore = artisans.map((item) => ({ ...item }));

export async function getArtisans() {
  return artisanStore.map((item) => ({ ...item }));
}

export async function getVerifiedArtisans() {
  return artisanStore.filter((artisan) => artisan.kycStatus === 'Verified' && artisan.status === 'Active');
}

export async function getArtisanById(id) {
  return artisanStore.find((artisan) => Number(artisan.id) === Number(id)) || null;
}

export async function updateArtisanStatus(id, status) {
  artisanStore = artisanStore.map((artisan) =>
    Number(artisan.id) === Number(id)
      ? {
          ...artisan,
          status,
          kycStatus: status === 'Active' ? 'Verified' : status === 'Pending Approval' ? 'Pending' : 'Failed',
        }
      : artisan
  );

  return getArtisanById(id);
}
