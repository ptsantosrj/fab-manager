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

    ## Create sender informations
    def generate_sender(customer_id)
      customer = User.find(customer_id)
      {
        name: customer.profile.full_name,
        email: customer.email,
        document: generate_document(customer)
      }        
    end

    ## generate hasgmap compatipble with pagseguro request
    def generate_items(cart_items, operator_id)
      operator = User.find(operator_id)
      items = Array.new
      cart =  case cart_items
              when ShoppingCart, Order
                cart_items
              else
                cs = CartService.new(operator)
                cs.from_hash(cart_items)
              end

      if cart.is_a? Order
        cart.order_items.map do |item|
          items << {
            id: item.orderable_id,
            description: "RESERVA FABLAB",
            amount: item.amount.to_i / 100.00,
            quantity: item.quantity.to_i
          }
        end
        return items
      end

      cart.items.map do |item|
        items << {
            id: 1,
            description: item.name,
            amount: item.price[:amount].to_i / 100.00,
            quantity: 1
        }
      end
      items
    end

    private

    def generate_document(customer)
      if customer.organization?
        return { type: "CNPJ", value: customer.profile.cpf }
      else
        return { type: "CPF", value: customer.profile.cpf }
      end
    end
  end
end
