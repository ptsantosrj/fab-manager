# frozen_string_literal: true

# Provides methods for pay cart by PagSeguro
class Payments::PagseguroService
  require 'pagseguro/helper'
  include Payments::PaymentConcern
  include PagSeguro

  def payment(order, coupon_code)
    amount = debit_amount(order, coupon_code)
    raise Cart::ZeroPriceError if amount.zero?

    user = order.statistic_profile.user

    id = PagSeguro::Helper.generate_ref(order, user.id)

    payment = PagSeguro::PaymentRequest.new
    payment.credentials = PagSeguro::AccountCredentials.new(Setting.get('pagseguro_email'), Setting.get('pagseguro_token'))
    payment.reference = @id
    payment.notification_url = "https://webhook.site/54f40941-7b67-435d-882b-5f53024fee15"
    payment.redirect_url = ENV['PAGSEGURO_URL_REDIRECT']
    payment.max_uses = 1
    payment.max_age = 30000  # em segundos
    # payment.extra_params << { Tipo: reservable.class.to_s }

    payment.sender = {
      name: user.profile.full_name,
      email: user.email,
      document: { type: "CPF", value: user.profile.cpf },
  }

  order.items.each_with_index do |product, index|
      payment.items << {
          id: index + 1,
          description: product.name,
          amount: product.price[:amount].to_i / 100.00,
          quantity: 1
      }
  end

    { order: order, payment: { code: id, url: 'test'} }
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
