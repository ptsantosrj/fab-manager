class API::PagseguroController < API::PaymentsController
    include PagSeguro
    
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
        credentials = PagSeguro::AccountCredentials.new(Setting.get('pagseguro_email'), Setting.get('pagseguro_token'))
        render json: credentials.as_json, status: :ok
    rescue StandardError => e
        render json: e, status: :bad_gateway
    end
end
