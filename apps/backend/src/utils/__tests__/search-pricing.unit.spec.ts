import { toProductPricing } from '../../search/helpers/pricing'

describe('search index prices', () => {
  it('are kept in rupiah: the cheapest variant gives the price, the dearest the max', () => {
    const pricing = toProductPricing({
      idr: [
        { calculated_price: { calculated_amount: 6_500_000, original_amount: 6_700_000 } },
        { calculated_price: { calculated_amount: 6_700_000, original_amount: 6_700_000 } },
        { calculated_price: null },
      ],
    })

    expect(pricing).toEqual({
      min_price_idr: 6_500_000,
      max_price_idr: 6_700_000,
      original_price_idr: 6_700_000,
      on_sale_idr: true,
    })
  })

  it('leave a product without a rupiah price out of the price fields', () => {
    expect(toProductPricing({ idr: [{ calculated_price: null }] })).toEqual({})
  })
})
