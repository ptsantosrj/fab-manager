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
        # Payments::PagseguroService.new.payment(cart, nil)

        # payment = PagSeguro::PaymentRequest.new
        # payment.credentials = PagSeguro::AccountCredentials.new(Setting.get('pagseguro_email'), Setting.get('pagseguro_token'))
        # payment.reference = @id
        # payment.notification_url = ENV['PAGSEGURO_URL_REDIRECT']
        # payment.redirect_url = ENV['PAGSEGURO_URL_REDIRECT']
        # payment.max_uses = 1
        # payment.max_age = 30000  # em segundos
        # # payment.extra_params << { Tipo: reservable.class.to_s }

        # payment.sender = {
        #     name: current_user.profile.full_name,
        #     email: current_user.email,
        #     document: { type: "CPF", value: current_user.profile.cpf },
        # }

        # cart.items.each_with_index do |product, index|
        #     payment.items << {
        #         id: index + 1,
        #         description: product.name,
        #         amount: product.price[:amount].to_i / 100.00,
        #         quantity: 1
        #     }
        # end

        # puts "=> REQUEST"
        # puts PagSeguro::PaymentRequest::RequestSerializer.new(payment).to_params
        # response = payment.register
        # if not response.errors.any?
        #     result = {
        #         code: response.code,
        #         url: response.url
        #     }
        #     render json: result.as_json, status: :ok and return
        # end
        # render(json: response.errors.as_json, status: :bad_gateway)
        
    rescue StandardError => e
        render json: e, status: :bad_gateway
    end
end
