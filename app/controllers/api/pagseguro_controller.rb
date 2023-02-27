class API::PagseguroController < API::PaymentsController
    require 'pagseguro/helper'
    require 'pagseguro/service'
    
    # PagSeguro don't has a specific method for test API when send a list request for test token
    def test_token
        credentials = PagSeguro::AccountCredentials.new(params['email'], params['token'])
        options = {
            per_page: 5,
            credentials: credentials
        }
          
        report = PagSeguro::Transaction.find_by_date(options)
        render json: report.as_json, status: :ok
    rescue StandardError => e
        render json: e, status: :unauthorized
    end

    # Create a request payment and return a object  with url for redirect to payment checkout
    def create_payment_link
        cart = shopping_cart
        amount = debit_amount(cart)
        @id = PagSeguro::Helper.generate_ref(params[:cart_items], params[:customer_id])
        result = PagSeguro::Service.new.create_payment(
            amount,
            @id,
            PagSeguro::Helper.generate_sender(params[:customer_id]),
            PagSeguro::Helper.generate_items(params[:cart_items], current_user.id)
        )
        render json: result.as_json, status: :ok and return       
    rescue StandardError => e
        render json: e, status: :bad_gateway
    end
end
