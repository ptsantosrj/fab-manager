class API::PagseguroController < API::PaymentsController
    include PagSeguro
    
    def test_token
        credentials = PagSeguro::AccountCredentials.new(params['token'], params['email'])
        options = {
            starts_at: 1.years.ago,
            per_page: 1,
            credentials: credentials # Unnecessary if you set in application config
          }
          
        report = PagSeguro::Transaction.find_by_date(options)
        render json: report.as_json, status: :ok
    rescue StandardError => e
        render json: e, status: :unprocessable_entity
    end
end
