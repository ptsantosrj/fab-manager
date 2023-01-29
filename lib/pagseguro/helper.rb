# frozen_string_literal: true

# PagSeguro payement gateway
module PagSeguro; end

## Provides various methods around the PagSeguro payment gateway
class PagSeguro::Helper
  class << self
    ## Is the PagSeguro gateway enabled?
    def enabled?
      return false unless Setting.get('online_payment_module')
      return false unless Setting.get('payment_gateway') == 'pagseguro'

      res = true
      %w[pagseguro_token pagseguro_email].each do |pg_setting|
        res = false unless Setting.get(pg_setting).present?
      end
      res
    end

    def human_error(error)
      I18n.t('errors.messages.gateway_error', { MESSAGE: error.message })
    end

    ## generate an unique string reference for the content of a cart
    def generate_ref(cart_items, customer)
      require 'sha3'

      content = { cart_items: cart_items, customer: customer }.to_json + DateTime.current.to_s
      # It's safe to truncate a hash. See https://crypto.stackexchange.com/questions/74646/sha3-255-one-bit-less
      SHA3::Digest.hexdigest(:sha224, content)[0...24]
    end

    ## Create customer informations
    def generate_customer(customer_id, operator_id, cart_items)
      customer = User.find(customer_id)
      operator = User.find(operator_id)

      {
        senderName: customer.name,
        senderEmail: customer.email
      }         
    end

    ## Generate a hash map compatible with PayZen 'V4/Customer/ShoppingCart'
    def generate_shopping_cart(cart_items, customer, operator)
      cart = if cart_items.is_a? ShoppingCart
               cart_items
             else
               cs = CartService.new(operator)
               cs.from_hash(cart_items)
             end
      pagseguro_items = cart.items.map do |item|
        {
          amount: item.price[:amount],
          description: item.name,
          quantity: 1,
        }
      end

      {
        cartItemInfo: cart.items.map do |item|
          {
            productAmount: item.price[:amount].to_i.to_s,
            productLabel: item.name,
            productQty: 1.to_s,
            productType: customer.organization? ? 'SERVICE_FOR_BUSINESS' : 'SERVICE_FOR_INDIVIDUAL'
          }
        end
      }
    end
  end
end
