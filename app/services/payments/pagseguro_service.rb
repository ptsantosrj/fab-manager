# frozen_string_literal: true

# Provides methods for pay cart by PagSeguro
class Payments::PagseguroService
  require 'pagseguro/helper'
  include Payments::PaymentConcern
  include PagSeguro

  def payment(order, coupon_code)
    amount = debit_amount(order, coupon_code)

    raise Cart::ZeroPriceError if amount.zero?

    id = PagSeguro::Helper.generate_ref(order, order.statistic_profile.user.id)

    payment_result = PagSeguro::Service.new.create_payment(
      amount,
      @id,
      PagSeguro::Helper.generate_sender(order.statistic_profile.user.id),
      PagSeguro::Helper.generate_items(order, order.statistic_profile.user.id)
    )

    { order: order, payment: payment_result }
  end

  def confirm_payment(order, coupon_code, payment_id)
    client = PayZen::Order.new
    payzen_order = client.get(payment_id, operation_type: 'DEBIT')

    if payzen_order['answer']['transactions'].any? { |transaction| transaction['status'] == 'PAID' }
      o = payment_success(order, coupon_code, 'card', payment_id, 'PayZen::Order')
      { order: o }
    else
      order.update(state: 'payment_failed')
      { order: order, payment: { error: { statusText: payzen_order['answer'] } } }
    end
  end
end
