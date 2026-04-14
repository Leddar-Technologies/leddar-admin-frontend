import { quotes } from '@/data/mockData';

let quoteStore = quotes.map((item) => ({ ...item }));

export async function getQuotes() {
  return quoteStore.map((quote) => ({ ...quote }));
}

export async function updateQuoteStatus(id, status) {
  quoteStore = quoteStore.map((quote) =>
    quote.id === id
      ? {
          ...quote,
          status,
        }
      : quote
  );

  return quoteStore.find((quote) => quote.id === id) || null;
}

export async function createQuote({ quoteId, materialsCost, labourCost, moq, notes }) {
  const total = Number(materialsCost || 0) + Number(labourCost || 0);
  quoteStore = quoteStore.map((quote) =>
    quote.id === quoteId
      ? {
          ...quote,
          status: 'Quote Sent',
          pricing: {
            materialsCost: Number(materialsCost || 0),
            labourCost: Number(labourCost || 0),
            moq: Number(moq || 0),
            notes,
            total,
          },
        }
      : quote
  );

  return quoteStore.find((quote) => quote.id === quoteId) || null;
}

export async function sendProductionPricing({ quoteId, fullProductionPrice, balanceDue }) {
  quoteStore = quoteStore.map((quote) =>
    quote.id === quoteId
      ? {
          ...quote,
          status: 'Production Pricing Sent',
          productionPricing: {
            fullProductionPrice: Number(fullProductionPrice || 0),
            balanceDue: Number(balanceDue || 0),
          },
        }
      : quote
  );

  return quoteStore.find((quote) => quote.id === quoteId) || null;
}
