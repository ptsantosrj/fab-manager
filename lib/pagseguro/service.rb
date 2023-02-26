# frozen_string_literal: true

# PagSeguro payement gateway
require 'payment/service'

module PagSeguro; end

## create remote objects on PagSeguro
class PagSeguro::Service < Payment::Service
    include PagSeguro

    def create_payment(amount, order_id, sender, items)
        payment = PagSeguro::PaymentRequest.new
        payment.credentials = PagSeguro::AccountCredentials.new(Setting.get('pagseguro_email'), Setting.get('pagseguro_token'))
        payment.reference = order_id
        payment.notification_url = "https://webhook.site/54f40941-7b67-435d-882b-5f53024fee15"
        payment.redirect_url = ENV['PAGSEGURO_URL_REDIRECT']
        payment.max_uses = 1
        payment.max_age = 30000  # em segundos
        payment.sender = sender
        items.each do |item|
            payment.items << item
        end

        puts "=> REQUEST"
        puts PagSeguro::PaymentRequest::RequestSerializer.new(payment).to_params
        response = payment.register
        if not response.errors.any?
            return {
                code: response.code,
                url: response.url
            }
        end
    end
end