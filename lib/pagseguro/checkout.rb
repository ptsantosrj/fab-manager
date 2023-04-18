# frozen_string_literal: true

require 'pagseguro/client'

# Checkout/* endpoints of the PagSeguro REST API
class PagSeguro::Checkout < PagSeguro::Client
  def initialize(base_url: nil, username: nil, password: nil, notification_url: nil, redirect_url: nil)
    super(base_url: base_url, username: username, password: password)
    @notification_url = notification_url || Rails.application.secrets.notification_url
    @redirect_url = Rails.application.secrets.redirect_url
  end

  ##
  # @see https://ws.sandbox.pagseguro.uol.com.br/v2/checkout/
  ##
  def get(order_id, operation_type: nil)
    post('/', orderId: order_id, operationType: operation_type)
  end

end
