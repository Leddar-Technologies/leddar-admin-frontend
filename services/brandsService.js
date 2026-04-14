import { brands } from '@/data/mockData';

let brandStore = brands.map((item) => ({ ...item }));

export async function getBrands() {
  return brandStore.map((item) => ({ ...item }));
}

export async function getBrandById(id) {
  return brandStore.find((brand) => Number(brand.id) === Number(id)) || null;
}

export async function updateBrandStatus(id, status) {
  brandStore = brandStore.map((brand) =>
    Number(brand.id) === Number(id)
      ? {
          ...brand,
          status,
          kycStatus: status === 'Active' ? 'Verified' : status === 'Pending Approval' ? 'Pending' : 'Failed',
        }
      : brand
  );

  return getBrandById(id);
}
